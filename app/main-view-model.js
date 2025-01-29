import { Observable, knownFolders, path, ObservableArray, fromObject, confirm, Dialogs } from '@nativescript/core';
import { FileUtils } from './fileutils';
import { FtpUtils } from './ftputils';
import { Utils } from './utils';
import { FiltroUtils } from './filtroutils';
import { DataUtils } from './datautils';
import { request } from "@nativescript-community/perms";
import { BackgroundFetch } from 'nativescript-background-fetch';

let viewModel;

export function createViewModel() {
  viewModel = new Observable();
  viewModel.counter = 2;
  viewModel.message = "";
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
    viewModel.set('qtdSalvos', "Salvos: 21");
    viewModel.set('qtdNaoSalvos', "Não salvos: 300 ");

    const arqConf = await FtpUtils.baixarArquivo({arquivo: "/Arquivos/appconfig.txt", destino: FileUtils.pastaLocal("appconfig.txt")});
    const configAll = JSON.parse(Utils.fixJSON(arqConf.resultado));
    const filtros = configAll.filtros;

    let cont = 1000;
    const abas = ["SALVO REMOTO", "NÃO SALVO", "CONFLITO"];
    if (viewModel.selecionados.length > 0) {
      viewModel.items.forEach((item) => {
        item.selecionado = false;
      });
      viewModel.selecionados = [];
    } else {
      viewModel.selecionados = [];
      
      let entrada = viewModel.items;
      let saida = [];
      for (let i = 0; i < filtros.length; i++) {
        const filtro = filtros[i];
        console.log(i, filtro);
        if (filtro.ativo) {
          console.log("Qtds: ", entrada.length, saida.length);
          const filtroParam = {
            saida: saida,
            entrada: entrada,
            atributos: {nome: "status", valor: abas[viewModel.abaSelecionada]},
            valor: filtro.valor,
            attr: filtro.attr
          };
          FiltroUtils[filtro.tipo](filtroParam);
          entrada = saida;
          viewModel.selecionados = saida;
          saida = [];
        }
      }
      // viewModel.selecionados = saida;
      for (let item of viewModel.selecionados) {
        item.selecionado = true;
      }
      // FiltroUtils[filtro.tipo](filtroParam);
    }
    // viewModel.items.notifyChange();
    viewModel.set('message', `Selecionados ${viewModel.selecionados.length} itens`);
    viewModel.notifyPropertyChange("items", []);
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
  viewModel.onTestes = onTestes;
  viewModel.onCancelar = onCancelar;

  viewModel.contar = (lista, objFiltro, titulo) => {
    const val = filtrar(lista, objFiltro);
    if (lista.length == 0) {
      return titulo;
    }
    return `${titulo} - ${val.length}`;
  };

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

/** ##########FUNCOES####### */

function onSelecionado(args) {
  // O item da lista correspondente
  
  const item = args.object.bindingContext;
  console.log("onSelecionado:Mudou: ", item.nome, args.value);
  item.selecionado = args.value;
  if (args.value) {
    const pos = viewModel.selecionados.indexOf(item);
    if (pos < 0) {
      viewModel.selecionados.push(item);
    }
  } else {
    const pos = viewModel.selecionados.indexOf(item);
    // console.log("onSelecionado:Removendo: ", item.nome, pos);
    if (pos >= 0) {
      viewModel.selecionados.splice(pos, 1);
    } else {
      // console.log("onSelecionado:NaoRemove: ", item.nome, pos);
    }
  }
}

function onTestes() {
  // FileUtils.requestReadContacts().then(
  //   (result) => {console.log(result);},
  //   (error) => {console.log(error);}
  // ); 
  // FileUtils.permissoes();
  for (let item of viewModel.selecionados) {
      console.log(item.nome, item.status, item.selecionado);
  }
}

function onCancelar() {
  viewModel.executando = false;
}

async function onBotaoAbas(args) {
  if (viewModel.executando) {
    viewModel.executando = false;
    return;
  }
  let lista = [];
  const abas = ["SALVO REMOTO", "NÃO SALVO", "CONFLITO"];
  const abasMess = ["Excluido", "Enviado", "Excluido"];
  const abasFunc = [onExcluir, onEnviar, onExcluirRemoto];
  for (const ii of viewModel.selecionados) {
    if (ii.status == abas[viewModel.abaSelecionada]) {
      lista.push(ii);
    }
  }
  // console.log(lista);
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
    const wakeLock = Utils.telaAtiva();
    viewModel.executando = true;
    viewModel.set('message', abasMess[viewModel.abaSelecionada] + ` 0 de ${lista.length} arquivos`);
    let cont = 0;
    let abaSelecionadaCongelada = viewModel.abaSelecionada;//congelando a aba selecionada, pois a interface fica livre para mexer
    for (let item of lista) {
      if (viewModel.executando) {
        let subArgs = {object: {}};
        subArgs.object.page = args.object.page;
        subArgs.object.bindingContext = item;
        subArgs.item = item;
        subArgs.semConfirmacao = true;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await abasFunc[abaSelecionadaCongelada](subArgs);
        item.selecionado = false;

        viewModel.set('message', abasMess[viewModel.abaSelecionada] + ` ${++cont} de ${lista.length} arquivos`);
      }
    }
    viewModel.executando = false;
    viewModel.set('message', "Concluido");
    Utils.liberarTela(wakeLock);
  } else {
    console.log("Cancelado ");
  }
}

async function onEnviar(args) {
  let item = args.item;
  if (args.item == null) {
    const page = args.object.page;
    const viewModel = page.bindingContext;
    item = args.object.bindingContext;
  }

  item.status = "Copiando...";
  const ret = await FtpUtils.copiarArquivo({arquivo: item.arqOriginal, pastaDestino: item.pastaRemota});
  if (ret.codRet == 1) {
    item.status = "SALVO REMOTO";
    console.log('Sucesso:  ', "Copiou com Sucesso");
  } else {
    viewModel.set('message', "Deu erro: " + ret.error);
    console.log('Erro: ', ret.error);
    item.status = "NÃO SALVO";
  }
  viewModel.notifyPropertyChange("items", []);
}

async function onExcluir(args) {
  const page = args.object.page;
  const viewModel = page.bindingContext;
  const item = args.object.bindingContext;
  const index = viewModel.items.indexOf(item);

  let confirmar = false;
  if (args.semConfirmacao) {
    confirmar = true;
  } else {
    await confirm({
      title: "Confirmação",
      message: "Você tem certeza que deseja excluir?",
      okButtonText: "Sim",
      cancelButtonText: "Não",
    }).then((result) => {
      confirmar = result;
    });
  }

  if (confirmar) {
    console.log("Ação confirmada:  " , index, item);
    let res = FileUtils.excluirArquivo(item);
    if (res.cod == 1) {
      viewModel.items.splice(index, 1);
      viewModel.notifyPropertyChange("items", []);
    }
  } else {
      console.log("Ação cancelada: ", index);
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
              viewModel.notifyPropertyChange("items", []);
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
  viewModel.set('message', "Listando...");
  const wakeLock = Utils.telaAtiva();
  viewModel.set('items', new ObservableArray([]));
  const arqConf = await FtpUtils.baixarArquivo({arquivo: "/Arquivos/appconfig.txt", destino: FileUtils.pastaLocal("appconfig.txt")});
  if (arqConf.codRet != 1) {
    Dialogs.alert({
      title: 'Erro',
      message: arqConf.error,
      okButtonText: 'OK',
      cancelable: true,
    });
    console.log(arqConf);
    console.log("DeviceId: ", Utils.getDeviceId());
    viewModel.set('message', "Sem arquivo de configuracao no servidor FTP.");
    Utils.liberarTela(wakeLock);
    return;
  }
  const configAll = JSON.parse(Utils.fixJSON(arqConf.resultado));
  let confDevice = configAll[Utils.getDeviceId()];
  if (confDevice == null) {
    viewModel.set('message', "O ID do dispositivo nao esta no arquivo de configuracao no servidor FTP.");
    Utils.liberarTela(wakeLock);
    return;
  }
  if (!FileUtils.temPermissao()) {
    viewModel.set('message', "Sem permissao de acesso ao armazenamento.");
    Utils.liberarTela(wakeLock);
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
      viewModel.set('message', JSON.stringify(retRemoto.error));
      Utils.liberarTela(wakeLock);
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
  viewModel.set('message', "Listado com sucesso.");
  Utils.liberarTela(wakeLock);
}

function info(args1, args2) {
  console.log("info: ", args1, args2);
  return "INFO";
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
