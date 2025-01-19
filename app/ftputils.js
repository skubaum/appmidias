import { FtpClient } from 'nativescript-ftp-client';
import { DataUtils } from './datautils';
import { FileUtils } from './fileutils';
import { ConectionUtils } from './connectionutils';

export class FtpUtils {
    static async contexto(param) {
        var client = new FtpClient();
        const ip = ConectionUtils.buscarIp();
        let ftpIp = "192.168.101.165";
        if (!ip.startsWith("192.168.101")) {
            ftpIp = "192.168.0.146";
        }
        await client.connect(ftpIp);
        await client.login('daniel', 'a');
        return client;
    }

    static async listarArquivos(param) {
        const mapTipos = {"file": "arquivo", "directory": "pasta"};
        param ??= {};
        param.grupos ??= ["pasta", "arquivo"];
        param.pasta ??= "";
        // console.log("FtpUtils.listarArquivos: ", param);
        try {
            var client = await this.contexto();
            // console.log("FtpUtils.listarArquivos1: ", client);
            const pastaRef = 'Arquivos/Videos/CelularDaniel';
            await client.changeDirectory(param.pasta);
            var list = await client.list();
            // console.log("FtpUtils.listarArquivos2: ", list);
            var pastas = [];
            for (let f of list) {
                f.pastaPai = param.pasta;
                f.tipo = mapTipos[f.type];
                f.nome = f.name;
                f.tamanho = f.size;
                f.dataModificacaoStr = DataUtils.formatarData(new Date(f.mdate), "dd/MM/yyyy HH:mm:ss");
                f.dataModificacao = new Date(f.mdate);
                if (param.grupos.includes(f.tipo)) {
                    pastas.push(f);
                }
            }
            client.disconnect();
            // console.log("FtpUtils.listarArquivos3: ");
            return {codRet: 1, resultado: pastas};
        } catch (ex) {
            console.log(ex);
            return {codRet: 0, error: ex};
        }
    }

    static async copiarArquivo(param) {
        //console.log("copiarArquivo: ", param);
        try {
            if (param.client != null) {
                var client = param.client;
            } else {
                var client = await this.contexto();
            }
            await client.changeDirectory(param.pastaDestino);
            await client.upload(param.arquivo._path);
            const ddConv = new Date(param.arquivo.lastModified).toUTCString() + "-0300";
            const dd = DataUtils.formatarData(new Date(ddConv), "yyyyMMddHHmmss");
            const comando = `MFMT ${dd} /${param.pastaDestino}/${param.arquivo.nome}`;
            //console.log("copiarArquivo: ", comando);
            const rr = await client.sendCustomCommand(comando);
            //console.log("copiarArquivo: ", rr);
            client.disconnect();
            return {codRet: 1};
        } catch (ex) {
            return {codRet: 0, error: ex};
        }
    }

    static async baixarArquivo(param) {
        console.log("baixarArquivo: ", param);
        try {
            var client = await this.contexto();
            await client.download(param.arquivo, param.destino);
            var res = FileUtils.lerArquivo(param.destino);
            client.disconnect();
            return {codRet: 1, resultado: res};
        } catch (ex) {
            console.log(ex);
            // throw ex;
            return {codRet: 0, error: JSON.stringify(ex)};
        }
    }

    static async excluirArquivo(param) {
        console.log("excluirArquivo: ", param);
        try {
            var client = await this.contexto();
            await client.deleteFile(param.arquivo);
            client.disconnect();
            return {codRet: 1};
        } catch (ex) {
            console.log(ex);
            return {codRet: 0, error: ex};
        }
    }
}