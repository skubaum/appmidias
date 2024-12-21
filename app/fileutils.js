import { Folder, File, path, knownFolders } from '@nativescript/core';
import { DataUtils } from './datautils';

export class FileUtils {
    static pastaLocal(args) {
      const folder = knownFolders.documents();
      //console.log(folder);
      if (args != null) {
        return folder._path + "/" + args;
      }
      return folder._path;
    }

    static lerArquivo(caminho) {
        const file = File.fromPath(caminho);
        return file.readTextSync();
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
            param.grupos ??= ["pasta", "arquivo"];

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
                f.dataModificacao = new Date(f.lastModified);
                f.dataModificacaoStr = DataUtils.formatarData(new Date(f.lastModified), "dd/MM/yyyy HH:mm:ss");
                if (param.grupos.includes(f.tipo)) {
                    resultado.push(f);
                }
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