import { Folder, File, path, knownFolders } from '@nativescript/core';

export class FileUtils {
    static listarArquivosPorPasta(folderPath) {
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

    static listCameraFiles() {
        try {
            // Obtenha a pasta principal (root) do dispositivo
            // const documents = knownFolders.documents();
            // const cameraPath = path.join(documents.path, "../0/DCIM/Camera");
            const externalStorage = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
            const cameraPath = path.join(externalStorage, "DCIM/Camera");
    
            // Acesse a pasta Camera
            const cameraFolder = Folder.fromPath(cameraPath);
            // const cameraFolder = Folder.fromPath("/data/user/0/DCIM/Camera");

            const cameraFolder2 = new java.io.File(cameraPath);
            

            console.log("cameraFolder2: ", cameraFolder2.listFiles());

            // cameraFolder.getEntities().then((entities) => {
            //     entities.forEach((entity) => {
            //         console.log(`Nome do arquivo: ${entity.name}, Caminho: ${entity.path}`);
            //     });
            // }, (error) => {
            //     console.error("Erro ao listar arquivos:", error);
            // });
    
            // Liste os arquivos na pasta
            const files = cameraFolder.getEntitiesSync(); // Retorna arquivos e subpastas
    
            console.log("Arquivos na pasta Camera:");
            console.log(files);
            files.forEach((entity) => {
                console.log("AQUI1: ", entity);
                // if (entity.isFile) {
                //     console.log("Arquivo:", entity.name);
                // } else if (entity.isFolder) {
                //     console.log("Pasta:", entity.name);
                // } else {
                //     console.log("AQUI: ", entity);
                // }
            });
        } catch (error) {
            console.error("Erro ao acessar a pasta Camera:", error);
        }
    }
}