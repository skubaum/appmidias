import { Observable, knownFolders, path, ObservableArray, fromObject, confirm } from '@nativescript/core';
import { FtpClient } from 'nativescript-ftp-client';
import { FileUtils, FtpUtils, Utils, DataUtils } from './utils';
import { request } from "@nativescript-community/perms";
import { BackgroundFetch } from 'nativescript-background-fetch';

function getMessage(counter) {
  if (counter <= 0) {
    return 'Hoorraaay! You unlocked the NativeScript clicker achievement!';
  } else {
    return `${counter} taps left`;
  }
}

let viewModel;

export function createViewModel() {
  viewModel = new Observable();
  viewModel.counter = 2;
  viewModel.message = getMessage(viewModel.counter);
  viewModel.items = new ObservableArray([]);
  viewModel.qtdSalvos = "Salvos";
  viewModel.qtdNaoSalvos = "Não salvos";

  viewModel.onTap = () => {
    viewModel.counter--;
    viewModel.set('message', getMessage(viewModel.counter));
    viewModel.set('qtdSalvos', "Salvos: 21");
    viewModel.set('qtdNaoSalvos', "Não salvos: 300");

    // log the message to the console  
    console.log(getMessage(viewModel.counter));
	  console.log("adada12");
  };

  viewModel.onFtp = async () => {
    const pastas = await FtpUtils.listarArquivos({apenasPastas: true});
    if (pastas.codRet == 1) {
      viewModel.set('items', pastas.resultado);
      viewModel.set('message', "Sucesso");
    } else {
      viewModel.set('message', JSON.stringify(pastas.error));
    }
  };
  
  viewModel.onEnviar = onEnviar;
  viewModel.onListar = onListar;
  viewModel.onExcluir = onExcluir;
  viewModel.onExcluirRemoto = onExcluirRemoto;
  viewModel.onInfo = onInfo;
  viewModel.onTask = configureBackgroundFetch;
  viewModel.filtrar = filtrar;
  viewModel.contar = (lista, objFiltro, titulo) => {
    const val = filtrar(lista, objFiltro);
    if (lista.length == 0) {
      return titulo;
    }
    return `${titulo} - ${val.length}`;
  };

  viewModel.onCancelar = (args) => {

    console.log("onCancelar");
    onEnviar(args);
  }

  return viewModel;
}

async function onEnviar(args) {
  const page = args.object.page;
  const viewModel = page.bindingContext;

  // O item da lista correspondente
  const item = args.object.bindingContext;

  // Obter o índice do item
  const index = viewModel.items.indexOf(item);

  // viewModel.items[index].set("status", "Copiando...");
  // viewModel.items[index].status = "Copiando...";
  item.status = "Copiando...";
  console.log("AQUI:  ", viewModel.items);
  // viewModel.items.notifyChange();
  console.log("Enviar pressionado no item: ", index, item);

  const ret = await FtpUtils.copiarArquivo({arquivo: item.arqOriginal, pastaDestino: item.pastaRemota});
  if (ret.codRet == 1) {
    // viewModel.set('message', "Copiou com Sucesso");
    // viewModel.items[index].set("status", "Copiou com Sucesso");
    // viewModel.items[index].status = "Copiou com Sucesso";
    item.status = "SALVO REMOTO";
    console.log('Sucesso:  ', "Copiou com Sucesso");
  } else {
    viewModel.set('message', "Deu erro: " + ret.error);
    // viewModel.items[index].set("status", "Deu erro: " + ret.error);
    // viewModel.items[index].status = "Deu erro: " + ret.error;
    console.log('Erro: ', ret.error);
    item.status = "NÃO SALVO";
  }
  viewModel.notifyPropertyChange("itens", []);
}

function onExcluir(args) {
  const page = args.object.page;
  const viewModel = page.bindingContext;
  const item = args.object.bindingContext;
  const index = viewModel.items.indexOf(item);

  confirm({
    title: "Confirmação",
    message: "Você tem certeza que deseja excluir?",
    okButtonText: "Sim",
    cancelButtonText: "Não",
  }).then((result) => {
      if (result) {
          console.log("Ação confirmada: ", index);
      } else {
          console.log("Ação cancelada: ", index);
      }
  });
}

async function onExcluirRemoto(args) {
  // const page = args.object.page;
  // const viewModel = page.bindingContext;
  const item = args.object.bindingContext;
  const index = viewModel.items.indexOf(item);

  confirm({
    title: "Confirmação",
    message: "Você tem certeza que deseja excluir?",
    okButtonText: "Sim",
    cancelButtonText: "Não",
  }).then((result) => {
      if (result) {
          console.log("Ação confirmada: ", `${item.arquivoRemoto.pastaPai}/${item.arquivoRemoto.nome}`);
          const param = {arquivo: `${item.arquivoRemoto.pastaPai}/${item.arquivoRemoto.nome}`};
          FtpUtils.excluirArquivo(param).then((result) => {
            if (result.codRet == 1) {
              console.log("Arquivo excluido: ", result);
              item.status = "NÃO SALVO";
              viewModel.notifyPropertyChange("itens", []);
            } else {
              console.log("Erro excluindo: ", result);
            }
          });
      } else {
          console.log("Ação cancelada: ", index);
      }
  });
}

function onInfo(args) {
  const page = args.object.page;
  const viewModel = page.bindingContext;
  const item = args.object.bindingContext;
  const index = viewModel.items.indexOf(item);

  console.log(item);
}

async function onListar(param, p2) {
  console.log("onListar: ", param, p2);
  const configAll = [
    {pastaRemota: "Arquivos/Fotos/CelularDaniel", pastaLocal: "DCIM/Camera", tipos: ["jpg"]},
    {pastaRemota: "Arquivos/Videos/CelularDaniel", pastaLocal: "DCIM/Camera", tipos: ["mp4"]}
  ];
  const configAll1 = [
    {pastaRemota: "Arquivos/Testes", pastaLocal: "DCIM/Camera", tipos: ["jpg"]}
  ];
  var arrFinal = [];
  for (let conf of configAll) {
    if (conf.tipos == null) {
      conf.tipos = [];
    }
    let retRemoto = await FtpUtils.listarArquivos({grupos: ["arquivo"], pasta: conf.pastaRemota});
    retRemoto.map = {};
    if (retRemoto.codRet == 1) {
      console.log("Qtd ftp:  ", retRemoto.resultado.length);
      for (let f of retRemoto.resultado) {
        retRemoto.map[f.nome] = f;
      }
    } else {
      viewModel.set('message', JSON.stringify(retRemoto.error));
      return;
    }

    var retLocal = FileUtils.listarArquivosPorPasta({pasta: conf.pastaLocal});
    if (retLocal.codRet == 1) {
      console.log("Qtd arquivos: ", retLocal.resultado.length);
      
      for (let f of retLocal.resultado) {
        if (conf.tipos.length > 0) {
          if (!conf.tipos.includes(f._extension.substr(1))) {
            //console.log("tipo nao aceito: ", f._extension.substr(1), f, conf);
            continue;
          }
        }
        f.pastaRemota = conf.pastaRemota;

        if (retRemoto.map[f.nome] != null) {
          // console.log("Arquivo ja salvo:   ", f);
          f.arquivoRemoto = retRemoto.map[f.nome];
          const dateDiff = Math.abs(retRemoto.map[f.nome].dataModificacao.getTime() - f.dataModificacao.getTime());
          if (retRemoto.map[f.nome].tamanho == f.tamanho && dateDiff < 2000) {
            f.status = "SALVO REMOTO";
          } else {
            f.status = "CONFLITO";
            f.dataModStr = DataUtils.formatarData(new Date(f.lastModified), "yyyyMMddHHmmss");
            if (retRemoto.map[f.nome].tamanho != f.tamanho) {
              f.statusExtra = "Tamanho diferente";
            }
            if (dateDiff < 2000) {
              f.statusExtra = "Data mod diferente";
            }
          }
          
          f.info = info;
          
        } else {
          f.status = "NÃO SALVO";
        }
        f.info = info;
        f.tamanhoFmt = Utils.formatarBytes(f.tamanho);
        f.arqOriginal = f;
        arrFinal.push(fromObject(f));
        // retLocal.map[f.name] = f;
      }
      // viewModel.set('items', new ObservableArray(arrFinal));
    }
  }
  viewModel.set('items', new ObservableArray(arrFinal));
}

function info(args1, args2) {
  console.log("info: ", args1, args2);
  return "INFO";
}

function permissao() {
  try {
    // const intent = new android.content.Intent(android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
    // const context = android.content.Context(this);
    // console.log(JSON.stringify(context));
    // const uri = android.net.Uri.parse("package:org.homesync.app");// + context.getPackageName());
    // intent.setData(uri);
    // context.startActivity(intent);
    request("storage").then((result) => {
      if (result) {
          console.log("Permissão concedida.");
          FileUtils.listCameraFiles(); // Sua função para listar os arquivos
      } else {
          console.log("Permissão negada.");
      }
    });
  } catch (ex) {
    console.log(ex);
  }
}

function filtrar(lista, objFiltro) {
  // const page = ctx.page;
  // const viewModel = page.bindingContext;
  // console.log("Filtrar: Inicio ");
  var res = [];
  for (let l of lista) {
    let entrar = true;
    const props = Object.keys(objFiltro);
    for (const p of props) {
      if (l[p] != objFiltro[p]) {
        entrar = false;
        break;
      }
    }
    if (entrar) {
      res.push(l);
    }
  }
  // console.log("Filtrar: ", res.length);
  return res;
}

function taskPeriodica() {
  const now = new Date();
  console.log(`Tarefa executada às ${now.toLocaleString()}`);

  try {
    // Exemplo de uma operação simples
    fetch('https://webhook.site/3dd0c483-0829-4350-b166-6c9bc1f23175', {
        method: 'POST',
        body: JSON.stringify({ 
            timestamp: now.getTime(),
            message: 'Tarefa periódica executada' 
        })
    }).catch(error => {
        console.error('Erro na requisição:', error);
    });
  } catch (error) {
      console.error('Erro na tarefa periódica:', error);
  }
}

function configureBackgroundFetch() {
  BackgroundFetch.configure({
      minimumFetchInterval: 15, // Intervalo mínimo aceito pelo sistema
      stopOnTerminate: false,   // Continua mesmo após o app ser fechado
      startOnBoot: true,        // Inicia ao reiniciar o dispositivo
      forceReload: false        // Não força recarregamento a cada fetch
  }, (taskId) => {
      // Executar a tarefa
      taskPeriodica();
      
      // Importante: sempre completar a tarefa
      BackgroundFetch.finish(taskId);
  }, (error) => {
      console.error('Erro no background fetch:', error);
  });

  // Definir o intervalo de fetch (algumas plataformas podem ajustar)
  BackgroundFetch.status((status) => {
      console.log('Status do background fetch:', status);
  });
}
