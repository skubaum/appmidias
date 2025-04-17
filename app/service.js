
import * as application from "@nativescript/core/application";

import { FileUtils } from './fileutils';
import { FtpUtils } from './ftputils';
import { Utils } from './utils';
import { ConectionUtils } from './connectionutils';

export const myService = android.app.Service.extend("org.homesync.myservice", {
    onCreate: function () {
        console.log("Serviço criado");
    },

    onStartCommand: function (intent, flags, startId) {
        console.log("Serviço iniciado comando");

        const context = application.android.context;
        const channelId = "homesync_service_channel";

        if (android.os.Build.VERSION.SDK_INT >= 26) {
            const channel = new android.app.NotificationChannel(
                channelId,
                "HomeSync Service Channel",
                android.app.NotificationManager.IMPORTANCE_LOW
            );
            const manager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            manager.createNotificationChannel(channel);
        }

        const builder = new android.app.Notification.Builder(context, channelId)
            .setContentTitle("HomeSync Ativo")
            .setContentText("O serviço está sendo executado em segundo plano.")
            .setSmallIcon(android.R.drawable.ic_dialog_info) 
            // .setSmallIcon(android.R.drawable.ic_popup_sync)
            .setOngoing(true);

        const notification = builder.build();
        const FOREGROUND_SERVICE_TYPE_DATA_SYNC = 0x00000001;
        // Verifique a versão do Android antes de usar FOREGROUND_SERVICE_TYPE_DATA_SYNC
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) { // Q is API 29
            this.startForeground(1, notification, FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            this.startForeground(1, notification);
        }
        if (!ConectionUtils.isWifi()) {
            console.log("Rede não é Wifi. Não executando tarefa de sincronização.");
            // Coloque aqui a lógica do serviço
            setTimeout(() => {
                console.log("✅ Tarefa concluída. Encerrando serviço.");
                this.stopSelf(); // <- Isso encerra o serviço
            }, 5000); // 5 segundos só como exemplo
            return android.app.Service.START_NOT_STICKY;
        }
        if (!ConectionUtils.servidorOnline()) {
            console.log("O servidor não está online. Não executando tarefa de sincronização.");
            // Coloque aqui a lógica do serviço
            setTimeout(() => {
                console.log("✅ Tarefa concluída. Encerrando serviço.");
                this.stopSelf(); // <- Isso encerra o serviço
            }, 5000); // 5 segundos só como exemplo
            return android.app.Service.START_NOT_STICKY;
        }

        // Coloque aqui a lógica do serviço
        // setTimeout(() => {
        //     console.log("✅ Tarefa concluída. Encerrando serviço.");
        //     this.stopSelf(); // <- Isso encerra o serviço
        // }, 5000); // 5 segundos só como exemplo

        listar("param", "p2").then(async (arrFinal) => {
            let contador = 20;
            try {
                for (let f of arrFinal) {
                    if (f.status == "NÃO SALVO") {
                        console.log("Enviando Arquivo: ", f.nome, f.status, f.statusExtra);
                        contador--;
                        const ret = await FtpUtils.copiarArquivo({arquivo: f.arqOriginal, pastaDestino: f.pastaRemota});
                        if (ret.codRet == 1) {
                            console.log('Sucesso:  ', "Copiou com Sucesso");
                        } else {
                            console.log('Erro: ', ret.error);
                        }
                    }
                    if (contador <= 0) {
                        break;
                    }
                }
            } catch (ex) {
                console.log("Erro: ", ex);
            }
            console.log("✅ Listagem concluída. Encerrando serviço.");
            this.stopSelf(); // <- Isso encerra o serviço
        });

        return android.app.Service.START_NOT_STICKY;
    },

    onDestroy: function () {
        console.log("Serviço destruído");
    },

    onBind: function (intent) {
        return null; // Retorne null se o serviço não for vinculado
    }
});

async function listar(param, p2) {
    try {
        console.log("onListar: ", param, p2);
        //   const wakeLock = Utils.telaAtiva();
        const arqConf = await FtpUtils.baixarArquivo({arquivo: "/Arquivos/appconfig.txt", destino: FileUtils.pastaLocal("appconfig.txt")});
        if (arqConf.codRet != 1) {
            console.log(arqConf);
            console.log("DeviceId: ", Utils.getDeviceId());
            console.log('message', "Sem arquivo de configuracao no servidor FTP.");
            // Utils.liberarTela(wakeLock);
            return;
        }
        const configAll = JSON.parse(Utils.fixJSON(arqConf.resultado));
        let confDevice = configAll[Utils.getDeviceId()];
        if (confDevice == null) {
            console.log('message', "O ID do dispositivo nao esta no arquivo de configuracao no servidor FTP.");
            console.log("ID: ", Utils.getDeviceId());
            // Utils.liberarTela(wakeLock);
            return;
        }
        if (!FileUtils.temPermissao()) {
            console.log('message', "Sem permissao de acesso ao armazenamento.");
            // Utils.liberarTela(wakeLock);
            return;
        }
        var arrFinal = [];
        for (let conf of confDevice.confs) {
            if (conf.tipos == null) {
                conf.tipos = [];
            }
            conf.ativo ??= true;
            if (!conf.ativo) {
                continue;
            }
            
            //FAZENDO OS DADOS REMOTOS
            let retRemoto = await FtpUtils.listarArquivos({grupos: ["arquivo"], pasta: conf.pastaRemota});
            retRemoto.map = {};
            if (retRemoto.codRet == 1) {
                console.log("Qtd ftp:  ", conf.pastaRemota, retRemoto.resultado.length);
                for (let f of retRemoto.resultado) {
                    retRemoto.map[f.nome] = f;
                }
            } else {
                console.log('message', JSON.stringify(retRemoto.error));
            //   Utils.liberarTela(wakeLock);
                return;
            }
            console.log("Varendo pasta remota.Fim / ", conf.pastaRemota);

            //FAZENDO OS DADOS LOCAIS
            // var retLocalPastas = FileUtils.listarArquivosPorPasta({pasta: conf.pastaLocal, grupos: ["pasta"]});
            // console.log("Varendo pasta local: Qtd: ", conf.pastaLocal, retLocalPastas.resultado);
            console.log("Varendo pasta local: ", conf.pastaLocal);
            var retLocal = FileUtils.listarArquivosPorPasta({pasta: conf.pastaLocal, grupos: ["arquivo"]});
            if (retLocal.codRet == 1) {
                console.log("Varendo pasta local: Qtd: ", conf.pastaLocal, retLocal.resultado.length);
            
                for (let f of retLocal.resultado) {
                    if (conf.tipos.length > 0) {
                        if (f._extension == null) {
                            continue;
                        }
                        if (f._extension != null && !conf.tipos.includes(f._extension.substr(1))) {
                            continue;
                        }
                    }
                    f.pastaRemota = conf.pastaRemota;
                    f.selecionado = false;

                    if (retRemoto.map[f.nome] != null) {
                        // console.log("Arquivo ja salvo:   ", f);
                        f.arquivoRemoto = retRemoto.map[f.nome];
                        f.statusExtra = [];
                        const dateDiff = Math.abs(retRemoto.map[f.nome].dataModificacao.getTime() - f.dataModificacao.getTime());
                        if (retRemoto.map[f.nome].tamanho != f.tamanho) {
                            f.statusExtra.push(`Tamanho diferente: ${f.tamanho} -> ${retRemoto.map[f.nome].tamanho}`);
                        }
                        if (dateDiff > 2000) {
                            // f.statusExtra.push(`Data mod diferente: ${f.dataModificacaoStr} -> ${retRemoto.map[f.nome].dataModificacaoStr}`);
                        }
                        if (f.statusExtra.length == 0) {
                            f.status = "SALVO REMOTO";
                        } else {
                            f.status = "CONFLITO";
                        }
                    
                    //   f.info = info;
                    
                    } else {
                        f.status = "NÃO SALVO";
                    }
                    // f.info = info;
                    f.tamanhoFmt = Utils.formatarBytes(f.tamanho);
                    f.arqOriginal = f;
                    arrFinal.push(f);
                    // retLocal.map[f.name] = f;
                }
            }
        }
        console.log('message', "Listado com sucesso.");
    } catch (ex) {
        console.log(ex);
    }
    return arrFinal;
//   Utils.liberarTela(wakeLock);
}