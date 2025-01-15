
import '@nativescript/core/globals'
import { FtpUtils } from './ftputils';

//console.log("[Worker] Iniciando tarefa...");

self.onmessage = function(args) {
    //console.log("Tarefa.onmessage: ", args);
    self.postMessage({tipo: "atualizar", mess: "Iniciando", mess2: args});
    enviar(args.data.dados);
}

async function enviar(item) {
    //console.log("Tarefa.enviar: ", item);
    self.postMessage({tipo: "atualizar", mess: "Enviar", mess2: item});
    let ret = await FtpUtils.copiarArquivo(item);
    self.postMessage({tipo: "terminar", ret: ret, error: ret.error.toString()});
}

async function enviarTeste(item) {
    //console.log("Tarefa.enviar: ", item);
    self.postMessage({tipo: "terminar", ret: 1, error: "dada"});
}
