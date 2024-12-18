import { Folder, File, path, knownFolders, Application, Connectivity } from '@nativescript/core';
import { FtpClient } from 'nativescript-ftp-client';

export class FileUtils {
    static listarArquivosPorPasta1(folderPath) {
      const folder = new Folder(folderPath);
      console.log(folder);
      folder.getEntities().then((entities) => {
          entities.forEach((entity) => {
              console.log(`Nome do arquivo: ${entity.name}, Caminho: ${entity.path}`);
          });
      }, (error) => {
          console.error("Erro ao listar arquivos:", error);
      });
    }

    static listarPastasExternas() {
        try {
            const externalStoragePath = File.external().path;
            FileSystem.getEntities(externalStoragePath).then((entities) => {
                entities.forEach((entity) => {
                    console.log(`Nome do arquivo: ${entity.name}, Caminho: ${entity.path}`);
                });
            }, (error) => {
                console.error("Erro ao listar arquivos:", error);
            });
        } catch (ex) {
            console.log(ex);
        }
    }

    static listarArquivosPorPasta(param) {
        try {
            param ??= {};
            param.pasta ??= "";

            const externalStorage = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
            const cameraPath = path.join(externalStorage, param.pasta);
            const cameraFolder = Folder.fromPath(cameraPath);
            console.log("cameraFolder: ", cameraFolder);

            //const cameraFolder2 = new java.io.File(cameraPath);
            //console.log("cameraFolder2: ", cameraFolder2.listFiles());
            // Liste os arquivos na pasta
            const files = cameraFolder.getEntitiesSync(); // Retorna arquivos e subpastas
            let resultado = [];
            files.forEach((f) => {
                f.pastaPai = param.pasta;
                f.tipo = f.isFolder ? "pasta" : "arquivo";
                f.nome = f.name;
                f.tamanho = f.size;
                f.dataModificacao = DataUtils.formatarData(new Date(f.lastModified), "dd/MM/yyyy HH:mm:ss");
                resultado.push(f);
                // console.log("AQUI1: ", entity);
                // if (entity.isFile) {
                //     console.log("Arquivo:", entity.name);
                // } else if (entity.isFolder) {
                //     console.log("Pasta:", entity.name);
                // } else {
                //     console.log("AQUI: ", entity);
                // }
            });
            return {codRet: 1, resultado: resultado};

        } catch (error) {
            console.error("Erro ao acessar a pasta Camera:", error);
            return {codRet: 0, resultado: "Erro ao acessar a pasta Camera", error: error};
        }
    }
}

export class ConectionUtils {
    static buscarIp() {
        if (this.isWifi()) {
            const mng = Application.android.getNativeApplication().getApplicationContext().getSystemService(android.content.Context.WIFI_SERVICE);
            const ipAddressInt = mng.getConnectionInfo().getIpAddress();
            const ipAddress = (
                (ipAddressInt & 0xFF) +
                '.' +
                ((ipAddressInt >> 8) & 0xFF) +
                '.' +
                ((ipAddressInt >> 16) & 0xFF) +
                '.' +
                ((ipAddressInt >> 24) & 0xFF)
            );
            return ipAddress;
        } else {
            return "192.168.101.165";
        }
    }

    static isWifi() {
        return Connectivity.getConnectionType() == 1;
    }
}

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
        console.log("FtpUtils.listarArquivos: ", param);
        try {
            var client = await this.contexto();
            console.log("FtpUtils.listarArquivos1: ", client);
            // const pastaRef = 'Arquivos/Videos/CelularDaniel';
            client.changeDirectory(param.pasta);
            var list = await client.list();
            console.log("FtpUtils.listarArquivos2: ", list);
            var pastas = [];
            for (let f of list) {
                f.pastaPai = param.pasta;
                f.tipo = mapTipos[f.type];
                f.nome = f.name;
                f.tamanho = f.size;
                f.dataModificacao = DataUtils.formatarData(new Date(f.mdate), "dd/MM/yyyy HH:mm:ss");
                if (param.grupos.includes(f.tipo)) {
                    pastas.push(f);
                }
            }
            client.disconnect();
            console.log("FtpUtils.listarArquivos3: ");
            return {codRet: 1, resultado: pastas};
        } catch (ex) {
            console.log(ex);
            return {codRet: 0, error: ex};
        }
    }

    static async copiarArquivo(param) {
        console.log("copiarArquivo: ", param);
        try {
            var client = await this.contexto();
            await client.changeDirectory(param.pastaDestino);
            await client.upload(param.arquivo._path);
            const dd = DataUtils.formatarData(new Date(param.arquivo._lastModified), "yyyyMMddHHmmss");
            const comando = `MFMT ${dd} /${param.pastaDestino}/${param.arquivo.nome}`;
            console.log("copiarArquivo: ", comando);
            const rr = await client.sendCustomCommand(comando);
            console.log("copiarArquivo: ", rr);
            client.disconnect();
            return {codRet: 1};
        } catch (ex) {
            console.log(ex);
            return {codRet: 0, error: ex};
        }
    }
}

export class DataUtils {
    static formatarData(date, format) {
      if (date == null || date == '' || typeof date.getDate == 'undefined') {
        return "";
      }
      if (Utils.nuloOuVazio(format)) {
        format = "dd/MM/yyyy";
      }
  
      // Mapeamento de tokens de formato para valores da data
      const map = {
        yyyy: date.getFullYear(),
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        dd: String(date.getDate()).padStart(2, '0'),
        HH: String(date.getHours()).padStart(2, '0'),
        mm: String(date.getMinutes()).padStart(2, '0'),
        ss: String(date.getSeconds()).padStart(2, '0'),
      };
  
      // Substitua os tokens no formato com os valores da data
      const formattedString = format.replace(/(yyyy|MM|dd|HH|mm|ss)/g, (match) => map[match]);
  
      return formattedString;
    }
  
    static parseData(dateString, format) {
      const valores = {yyyy: format.indexOf("yyyy"), MM: format.indexOf("MM"), dd: format.indexOf("dd"), HH: format.indexOf("HH"), mm: format.indexOf("mm"), ss: format.indexOf("ss")};
      const dateInfo = {};
      Object.keys(valores).forEach((part, index) => {
        if (part) {
          if (valores[part] >= 0) {
            dateInfo[part] = parseInt(dateString.substring(valores[part], valores[part] + part.length), 10);
          }
        }
      });
  
      const year = dateInfo['yyyy'];
      const month = dateInfo['MM'] - 1; // O mês em JavaScript é baseado em zero
      const day = dateInfo['dd'];
      const hour = dateInfo['HH'] || 0;
      const minute = dateInfo['mm'] || 0;
      const second = dateInfo['ss'] || 0;
  
      return new Date(year, month, day, hour, minute, second);
    }
  
    static obterDiasDaSemana(ref) {
      // Obter a data atual
      var hoje = ref;
      if (ref == null) {
        hoje = new Date();
      }
  
      // Obter o primeiro dia da semana (domingo) e calcular a diferença de dias
      const primeiroDiaDaSemana = hoje.getDate() - hoje.getDay() - 1;
      
      // Inicializar um array para armazenar os dias da semana
      const diasDaSemana = [];
  
      // Loop para obter os dias da semana
      for (let i = 0; i < 7; i++) {
        const dia = new Date(hoje);
        dia.setDate(primeiroDiaDaSemana + i);
        diasDaSemana.push(dia);
      }
  
      return diasDaSemana;
    }
  
    /**
     * Returns the difference, of a given type, between two dates.
     * Usage:
     * dateDiff(var,var,var);
     * 1: Date - The Variable with the Startdate.
     * 2: Date - The Variable with the Endate.
     * 3: String - The Type which represents the the return value.
     * y - Years
     * m - Months
     * d - Days
     * w - Weeks
     * wd - Workingdays
     * hh - Hours
     * mi - Minutes
     * ss - Seconds
     * 
     * Encontrei os fontes aqui e pedi para o chatgpt converter para javascript:
     * https://github.com/pentaho/pentaho-kettle/blob/master/engine/src/main/java/org/pentaho/di/trans/steps/scriptvalues_mod/ScriptValuesAddedFunctions.java
     */
    static dateDiff(dIn1, dIn2, strType) {
      if (arguments.length === 3) {
        try {
          if (dIn1 === null || dIn2 === null || strType === null) {
            return NaN;
          } else if (dIn1 === undefined || dIn2 === undefined || strType === undefined) {
            return undefined;
          } else {
            const startDate = new Date(dIn1);
            const endDate = new Date(dIn2);
  
            let endL = endDate.getTime();
            let startL = startDate.getTime();
  
            //if (compensateForLocalTime()) {
              endL += endDate.getTimezoneOffset() * 60 * 1000;
              startL += startDate.getTimezoneOffset() * 60 * 1000;
            //}
  
            if (strType === 'y') {
              return endDate.getFullYear() - startDate.getFullYear();
            } else if (strType === 'm') {
              const monthsToAdd = (endDate.getFullYear() - startDate.getFullYear()) * 12;
              return (endDate.getMonth() - startDate.getMonth()) + monthsToAdd;
            } else if (strType === 'd') {
              return (endL - startL) / (24 * 60 * 60 * 1000);
            } else if (strType === 'wd') {
              let iOffset = -1;
              if (endDate < startDate) {
                iOffset = 1;
              }
              let iRC = 0;
              while ((iOffset === 1 && endL < startL) || (iOffset === -1 && endL > startL)) {
                const day = endDate.getDay();
                if (day !== 0 && day !== 6) {
                  iRC++;
                }
                endDate.setDate(endDate.getDate() + iOffset);
                endL = endDate.getTime() + endDate.getTimezoneOffset() * 60 * 1000;
              }
              return iRC;
            } else if (strType === 'w') {
              const iDays = Math.floor((endL - startL) / (24 * 60 * 60 * 1000));
              return Math.floor(iDays / 7);
            } else if (strType === 'ss') {
              return Math.floor((endL - startL) / 1000);
            } else if (strType === 'mi') {
              return Math.floor((endL - startL) / (60 * 1000));
            } else if (strType === 'hh') {
              return Math.floor((endL - startL) / (60 * 60 * 1000));
            } else {
              return Math.floor((endL - startL) / (24 * 60 * 60 * 1000));
            }
          }
        } catch (e) {
          throw new Error(e.toString());
        }
      } else {
        throw new Error('A função dateDiff requer 3 argumentos.');
      }
    }
  
    static somarData(data, qtdDias, qtdMeses, qtdAnos) {
      var inicio = new Date();
      inicio.setDate(data.getDate());
      inicio.setUTCMonth(inicio.getMonth() + qtdMeses);
      inicio.setDate(inicio.getDate() + qtdDias);
      inicio.setFullYear(inicio.getFullYear() + qtdAnos);
      return inicio;
    }
  
    static dateAdd(dIn, strType, iValue) {
      try {
          var cal = new Date(dIn);
          if (strType === "y") {
              cal.setFullYear(cal.getFullYear() + iValue);
          } else if (strType === "m") {
              cal.setMonth(cal.getMonth() + iValue);
          } else if (strType === "d") {
              cal.setDate(cal.getDate() + iValue);
          } else if (strType === "w") {
              cal.setDate(cal.getDate() + (iValue * 7));
          } else if (strType === "wd") {
              var iOffset = 0;
              while (iOffset < iValue) {
                  cal.setDate(cal.getDate() + 1);
                  var day = cal.getDay();
                  if (day !== 0 && day !== 6) {
                      iOffset++;
                  }
              }
          } else if (strType === "hh") {
              cal.setHours(cal.getHours() + iValue);
          } else if (strType === "mi") {
              cal.setMinutes(cal.getMinutes() + iValue);
          } else if (strType === "ss") {
              cal.setSeconds(cal.getSeconds() + iValue);
          }
          return cal;
      } catch (e) {
          throw new Error(e.toString());
      }
    }
  
    static anoAtual() {
      return new Date().getFullYear();
    }
  
    static anoMesAtual() {
      return this.anoMesPorData(new Date());
    }
  
    static anoMesPorData(data) {
      return data.getFullYear() + "" + (((data.getMonth() + 1) + "").padStart(2 , "0"));
    }
  
    static converterTempo(tempo) {
      var mili = tempo % 1000;
      tempo = Math.round(tempo / 1000);
      var segundos = tempo % 60;
      tempo = Math.round(tempo / 60);
      var minutos = tempo % 60;
      tempo = Math.round(tempo / 60);
      var horas = tempo;
      return (horas + "").padStart(2, "0") + ":" + (minutos + "").padStart(2, "0") + ":" + (segundos + "").padStart(2, "0") + "." + (mili + "").padStart(3, "0");
    }
  
    static contarHoras(tempo, tipo) {
      var mili = tempo % 1000;
      tempo = Math.round(tempo / 1000);
      var segundos = tempo % 60;
      tempo = Math.round(tempo / 60);
      var minutos = tempo % 60;
      return Math.round(tempo / 60);
    }
  
    static mesAnoPorDataFormatado(data) {
      var meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      return meses[data.getMonth()] + "/" + data.getFullYear();
    }
  
    static mesAtual() {
      var meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      return meses[new Date().getMonth()];
    }
  
    static mesReverso(ref) {
      var meses = ["", "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
      var mesesRev = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
      for (var i = 0; i < meses.length; i++) {
        if (ref.toUpperCase() == meses[i]) {
          return mesesRev[i];
        }
      }
      return "00";
    }
  
    static mesAtualEmNumero() {
      return new Date().getMonth() + 1;
    }
  
    static mesPorExtenso(pos) {
      return ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"][pos];
    }
  
    static testarData(param) {
      return typeof param.getDate == "function";
    }
    
  }

  export class Utils {
    static nuloOuVazio(param) {
        if (param == null) {
            return true;
        }
        if (typeof param.trim == 'function') {
            return param.trim() == '';
        }
        return param == '';
    }
  }