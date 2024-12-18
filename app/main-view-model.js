import { Observable, knownFolders, path, ObservableArray, fromObject } from '@nativescript/core';
import { FtpClient } from 'nativescript-ftp-client';
import { FileUtils, FtpUtils } from './utils';
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

  viewModel.onTap = () => {
    viewModel.counter--;
    viewModel.set('message', getMessage(viewModel.counter));
    viewModel.set('status', "Enviando....");

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
  
  viewModel.onPastaSelecionada = async (args) => {
    const listView = args.object;
    console.log('Tapped index', args.index);
    console.log('Tapped item ', listView.items[args.index]);
    const ret = await FtpUtils.copiarArquivo({arquivo: listView.items[args.index], pastaDestino: "Arquivos/Testes"});
    if (ret.codRet == 1) {
      viewModel.set('message', "Copiou com Sucesso");
    } else {
      viewModel.set('message', "Deu erro: " + ret.error);
      console.log('Erro: ', ret.error);
    }
  }

  viewModel.onEnviar = onEnviar;

  viewModel.onListar = onListar;
  viewModel.onTask = configureBackgroundFetch;

  viewModel.onCancelar = (args) => {

    console.log("onCancelar");
    onEnviar(args);
  }

  return viewModel;
}

export async function onEnviar(args) {
  const page = args.object.page;
  const viewModel = page.bindingContext;

  // O item da lista correspondente
  const item = args.object.bindingContext;

  // Obter o índice do item
  const index = viewModel.items.indexOf(item);

  // viewModel.items[index].set("status", "Copiando...");
  // viewModel.items[index].status = "Copiando...";
  item.status = "Copiando...";
  console.log("AQUI: ", viewModel.items);
  // viewModel.items.notifyChange();
  console.log("Enviar pressionado no item: ", index, item);

  const ret = await FtpUtils.copiarArquivo({arquivo: item, pastaDestino: "Arquivos/Fotos/CelularDaniel"});
  // const ret = await FtpUtils.copiarArquivo({arquivo: item, pastaDestino: "Arquivos/Testes"});
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
    item.status = "NÃO SALVO" + ret.error;
  }
  // viewModel.items.notifyChange();

  
}

async function onListar(param, p2) {
  console.log("onListar: ", param, p2);
  let retRemoto = await FtpUtils.listarArquivos({grupos: ["arquivo"], pasta: "Arquivos/Fotos/CelularDaniel"});
  // let retRemoto = await FtpUtils.listarArquivos({grupos: ["arquivo"], pasta: "Arquivos/Testes"});
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

  var retLocal = FileUtils.listarArquivosPorPasta({pasta: "DCIM/Camera"});
  if (retLocal.codRet == 1) {
    viewModel.set('message', "Qtd arquivos: " + retLocal.resultado.length);
    console.log("Qtd arquivos: ", retLocal.resultado.length);
    var arrFinal = [];
    for (let f of retLocal.resultado) {
      // console.log("local: ", f);
      if (retRemoto.map[f.nome] != null) {
        console.log("Arquivo ja salvo:  ", f);
        f.status = "SALVO REMOTO";
        f.info = info;
      } else {
        f.status = "NÃO SALVO";
        f.info = info;
      }
      arrFinal.push(fromObject(f));
      // retLocal.map[f.name] = f;
    }
    viewModel.set('items', new ObservableArray(arrFinal));
  } else {
    console.log("onListar: ", retLocal.error);
    viewModel.set('message', "Erro:  " + retLocal.error);
    return;
  }
}

export function info(args1, args2) {
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
