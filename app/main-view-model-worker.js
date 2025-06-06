import { Observable, knownFolders, path, ObservableArray, fromObject, confirm, Dialogs } from '@nativescript/core';
import { FileUtils } from './fileutils';
import { FtpUtils } from './ftputils';
import { Utils } from './utils';
import { DataUtils } from './datautils';
import { request } from "@nativescript-community/perms";
import { BackgroundFetch } from 'nativescript-background-fetch';

function getMessage(counter) {
  if (counter <= 0) {
    return 'Hoorraaay! You unlocked!';
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
  viewModel.abaSelecionada = 0;
  viewModel.selecionados = [];
  viewModel.cancelar = false;
  viewModel.executando = false;
  viewModel.abasBotoes = () => {
    if (viewModel.executando) {
      return "CANCELAR";
    }
    return ['EXCLUIR LOCAL', 'ENVIAR SELECIONADOS', 'EXCLUIR REMOTO'][viewModel.abaSelecionada];
  };

  viewModel.onTap = async () => {
    viewModel.counter--;
    viewModel.set('message', getMessage(viewModel.counter));
    viewModel.set('qtdSalvos', "Salvos: 21");
    viewModel.set('qtdNaoSalvos', "Não salvos: 300 ");

    // log the message to the console  
    // console.log(FileUtils.listarPastaLocal()) ;
    // console.log(viewModel.items._array[0]);
    // viewModel.items._array[0].selecionado = true;
    // viewModel.items._array[1].selecionado = true;
    let cont = 1000;
    viewModel.items.forEach((item) => {
      const abas = ["SALVO REMOTO", "NÃO SALVO", "CONFLITO"];
      if (item.status == abas[viewModel.abaSelecionada]) {
        cont--;
        if (cont > 0) {
          item.selecionado = !item.selecionado;
          if (item.selecionado) {
            if (viewModel.selecionados.indexOf(item) < 0) {
              viewModel.selecionados.push(item);
            }
          } else {
            const subIndex = viewModel.selecionados.indexOf(item);
            if (subIndex >= 0) {
              viewModel.selecionados.splice(subIndex, 1);
            }
          }
        }
      }
    });
    // viewModel.items.notifyChange();
    viewModel.notifyPropertyChange("itens", []);
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
  viewModel.onBotaoAbas = onBotaoAbas;
  viewModel.onSelecionado = onSelecionado;

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

  viewModel.onItemTap = (args) => {

    const index = args.index;
    const item = this.items.getItem(index);

    // Limpe a seleção anterior
    this.items.forEach((itm) => itm.selecionado = false);

    // Marque o item atual como selecionado
    item.selecionado = true;

    console.log(`Item selecionado: ${item.name}`);
  }

  return viewModel;
}

function onSelecionado(args) {
  // O item da lista correspondente
  const item = args.object.bindingContext;
  if (args.value) {
    viewModel.selecionados.push(item);
  } else {
    const pos = viewModel.selecionados.indexOf(item);
    viewModel.selecionados.splice(pos, 1);
  }
  // console.log("onSelecionado:  ", viewModel.selecionados);
}

async function onBotaoAbas(args) {
  let lista = [];
  const abas = ["SALVO REMOTO", "NÃO SALVO", "CONFLITO"];
  const abasMess = ["Excluido", "Enviado", "Excluido"];
  const abasFunc = [onExcluir, onStartLongTask, onExcluirRemoto];
  for (const ii of viewModel.selecionados) {
    if (ii.status == abas[viewModel.abaSelecionada]) {
      lista.push(ii);
    }
  }
  let confirmar = false;
  await confirm({
    title: "Confirmação",
    message: "Você tem certeza que deseja continuar?",
    okButtonText: "Sim",
    cancelButtonText: "Não",
  }).then((result) => {
    confirmar = result;
  });

  if (confirmar) {
    viewModel.executando = true;
    viewModel.set('message', abasMess[viewModel.abaSelecionada] + ` 0 de ${lista.length} arquivos`);
    abasFunc[viewModel.abaSelecionada]({funcao: abas[viewModel.abaSelecionada], dados: lista});
  } else {
    console.log("Cancelado ");
  }
}

function onStartLongTask(args) {
  const worker = new Worker("./tarefas"); // Caminho do Worker

  worker.onmessage = function (msg) {
      console.log("recebendo mensagem: ", msg);
      if (msg.tipo == "terminar") {
        args.sucesso(msg);
        worker.terminate(); // Finaliza o Worker após o uso
      }

      if (msg.tipo == "atualizar") {
        args.atualizar(msg);
      }
  };

  worker.onerror = function (err) {
      args.erro(msg);
      worker.terminate();
  };

  console.log("Iniciando o Worker...", worker);
  worker.postMessage(args.rotina); // Envia dados para o Worker
  console.log("Iniciado5 o Worker...");
}

async function onEnviar(args) {
  let item = args.item;
  if (args.item == null) {
    const page = args.object.page;
    const viewModel = page.bindingContext;
    item = args.object.bindingContext;
  }

  let paramWorker = {};
  paramWorker.sucesso = function(msg) {
    if (msg.ret.codRet == 1) {
      item.status = "SALVO REMOTO";
      console.log('Sucesso:  ', "Copiou com Sucesso");
    } else {
      viewModel.set('message', "Deu erro: " + msg.ret.error);
      console.log('Erro: ', msg.ret.error);
      item.status = "NÃO SALVO";
    }
    viewModel.notifyPropertyChange("itens", []);
  }

  paramWorker.atualizar = function(msg) {
    console.log("onEnviar.atualizar: ", msg);
  }

  paramWorker.erro = function(msg) {
    viewModel.set('message', "Deu erro: " + msg.error);
    console.log('Erro: ', msg.error);
    item.status = "NÃO SALVO";
  }

  console.log(item.arqOriginal);
  const arquivo = {_path: item.arqOriginal._path, nome: item.arqOriginal.nome, lastModified: item.arqOriginal.lastModified};

  let dados = {arquivo: arquivo, pastaDestino: item.pastaRemota};
  const client = await FtpUtils.contexto();
  dados.client = client;
  paramWorker.rotina = {funcao: "enviar", dados: dados};
  
  item.status = "Copiando...";
  onStartLongTask(paramWorker);
}


async function onEnviarAntes(args) {
  let item = args.item;
  if (args.item == null) {
    const page = args.object.page;
    const viewModel = page.bindingContext;
    item = args.object.bindingContext;
  }

  item.status = "Copiando...";
  const arquivo = {_path: item.arqOriginal._path, nome: item.arqOriginal.nome, lastModified: item.arqOriginal.lastModified};
  const ret = await FtpUtils.copiarArquivo({arquivo: arquivo, pastaDestino: item.pastaRemota});
  if (ret.codRet == 1) {
    item.status = "SALVO REMOTO";
    console.log('Sucesso:  ', "Copiou com Sucesso");
  } else {
    viewModel.set('message', "Deu erro: " + ret.error);
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

  if (args.semConfirmacao) {
    console.log("Excluindo: ", index);
  } else {
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

  Dialogs.alert({
    title: 'Erro',
    message: JSON.stringify(item.statusExtra),
    okButtonText: 'OK',
    cancelable: true,
  });
}

async function onListar(param, p2) {
  console.log("onListar: ", param, p2);
  const arqConf = await FtpUtils.baixarArquivo({arquivo: "/Arquivos/appconfig.txt", destino: FileUtils.pastaLocal("appconfig.txt")});
  if (arqConf.codRet != 1) {
    Dialogs.alert({
      title: 'Erro',
      message: arqConf.error,
      okButtonText: 'OK',
      cancelable: true,
    });
    console.log(arqConf);
    return;
  }
  const configAll = JSON.parse(Utils.fixJSON(arqConf.resultado));
  let confDevice = configAll[Utils.getDeviceId()];
  var arrFinal = [];
  for (let conf of confDevice.confs) {
    if (conf.tipos == null) {
      conf.tipos = [];
    }
    
    //FAZENDO OS DADOS REMOTOS
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

    //FAZENDO OS DADOS LOCAIS
    var retLocalPastas = FileUtils.listarArquivosPorPasta({pasta: conf.pastaLocal, grupos: ["pasta"]});
    console.log("Pastas: ", retLocalPastas.resultado);
    var retLocal = FileUtils.listarArquivosPorPasta({pasta: conf.pastaLocal, grupos: ["arquivo"]});
    if (retLocal.codRet == 1) {
      console.log("Qtd arquivos: ", retLocal.resultado.length);
      
      for (let f of retLocal.resultado) {
        if (conf.tipos.length > 0) {
          try {
            conf.tipos.includes(f._extension.substr(1));
          } catch(ex) {
            console.log(f);
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
