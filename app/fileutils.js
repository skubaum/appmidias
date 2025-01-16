import { Folder, File, path, knownFolders, Application } from '@nativescript/core';
import { DataUtils } from './datautils';
import { check, permissionTypes, request } from "ns-permissions";

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
        this.permissoes();
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

    static excluirArquivo(param) {
        try {
            this.permissoes();
            const file = File.fromPath(param._path);
            if (File.exists(param._path)) {
                let resultado = {cod: 1};
                file.removeSync((err) => {
                    console.error(`Erro ao excluir o arquivo '${param._path}':`, err);
                    resultado = {cod: 2, error: `Erro ao excluir o arquivo '${param._path}': ${err}`};
                });
                return resultado;
            } else {
                console.warn(`Arquivo '${param._path}' não encontrado!`);
                return {cod: 0, error: `Arquivo '${param._path}' não encontrado!`};
            }
        } catch (ex) {
            console.log(ex);
            return {cod: 3, error: `Erro ao excluir o arquivo '${param._path}': ${ex}`};
        }
    }

    static listarArquivosPorPasta(param) {
        try {
            this.permissoes();
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

    static permissao() {
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
          } else {
              console.log("Permissão negada.");
          }
        });
      } catch (ex) {
        console.log(ex);
      }
    }

    static async solicitarPermissoes() {
        if (Application.android) {
            console.log(Permissions);
            const hasPermission = Permissions.hasPermission(Application.android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
            if (!hasPermission) {
                await Permissions.requestPermission(Application.android.Manifest.permission.WRITE_EXTERNAL_STORAGE, "Permissão necessária para acessar arquivos.");
            }
        }
    }

    static requestReadContacts2() {
        return new Promise((resolve, reject) => {
          check(android.Manifest.permission.MANAGE_EXTERNAL_STORAGE).then((result) => {
            if (result[0] === 'authorized') {
              resolve("Sucesso: ja autorizado");
            } else if (result[0] === 'restricted') {
              reject("Error por restrito: " + result[0]);
            } else {
              request(android.Manifest.permission.MANAGE_EXTERNAL_STORAGE).then((requestResult) => {
                requestResult[0] === 'authorized' ? resolve("Sucesso de pedir: " + requestResult[0]) : reject("Erro, nao autorizado: " + requestResult[0]);
              }).catch((ex) => reject(ex));
            }
          });
        });
    }

    static requestReadContacts() {
        return new Promise((resolve, reject) => {
          check(permissionTypes.storage).then((result) => {
            if (result[0] === 'authorized') {
              resolve("Sucesso: ja autorizado");
            } else if (result[0] === 'restricted') {
            //   reject("Error por restrito: " + result[0]); 
            // } else {
              request(permissionTypes.storage).then((requestResult) => {
                requestResult[0] === 'authorized' ? resolve("Sucesso de pedir: " + requestResult[0]) : reject("Erro, nao autorizado: " + requestResult[0]);
              }).catch((ex) => reject(ex));
            }
          });
        });
    }

    static perm() {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            if (!android.os.Environment.isExternalStorageManager()) {
                const packageName = Application.android.getNativeApplication().getApplicationContext().getPackageName();
                const intent = new android.content.Intent(
                    android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION
                );
                intent.setData(
                    android.net.Uri.fromParts("package", packageName, null)
                );
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                Application.android.getNativeApplication().getApplicationContext().startActivity(intent);
            }
        }
    }

    static permissoes() {
        this.perm();
    }
}