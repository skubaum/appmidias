import { Observable, knownFolders, path } from '@nativescript/core';
import { FtpClient } from 'nativescript-ftp-client';
import { FileUtils } from './utils';
import { request } from "@nativescript-community/perms";
import { android as androidApp } from "@nativescript/core/application";

function getMessage(counter) {
  if (counter <= 0) {
    return 'Hoorraaay! You unlocked the NativeScript clicker achievement!';
  } else {
    return `${counter} taps left`;
  }
}

export function createViewModel() {
  const viewModel = new Observable();
  viewModel.counter = 2;
  viewModel.message = getMessage(viewModel.counter);
  viewModel.items = [];

  viewModel.onTap = () => {
    viewModel.counter--;
    viewModel.set('message', getMessage(viewModel.counter));

    // log the message to the console
    console.log(getMessage(viewModel.counter));
	  console.log("adada12");
  };

  viewModel.onFtp = async () => {
    viewModel.set('message', 'FTP1');
    // new it.sauronsoftware.ftp4j.FTPClient();
    // log the message to the console
	  try {
      var client = new FtpClient();
      await client.connect('192.168.101.165');
      await client.login('daniel', 'a');
      client.changeDirectory('Arquivos');
      var list = await client.list();
      var pastas = [];
      for (let i of list) {
        if (i.type == "directory") {
          i.pastaPai = 'Arquivos';
          pastas.push(i);
        }
      }
      viewModel.set('items', pastas);
      console.log(list);
    } catch (ex) {
      console.log(ex);
	    viewModel.set('message', ex);
    }
    console.log('FTP teste');
  };
	  
  viewModel.onPastaSelecionada = (args) => {
    const listView = args.object;
    console.log('Tapped index', args.index);
    console.log('Tapped item', listView.items[args.index]);
  }

  viewModel.onListar = onListar;

  return viewModel;
}

function onListar() {
  console.log("onListar:  ", knownFolders.currentApp());
  // FileUtils.listarArquivosPorPasta("/data/user/0");
  // FileUtils.listarPastasExternas();
  permissao();
  // FileUtils.listCameraFiles();
  // File dcimDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM).toString());
  // try {
  //   const externalStorage = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
  //   const cameraPath = path.join(externalStorage, "DCIM/Camera");
  //   console.log("external: ", cameraPath);
  // } catch (ex) {
  //   console.log(ex);
  // }
}

function permissao() {
  try {
    // const intent = new android.content.Intent(android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
    // const context = android.content.Context(this);
    // console.log(JSON.stringify(context));
    // const uri = android.net.Uri.parse("package:org.homesync.app");// + context.getPackageName());
    // intent.setData(uri);
    // context.startActivity(intent);
    requestNativeStoragePermission();
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

function requestNativeStoragePermission() {
  console.log("requestNativeStoragePermission");
  const activity = androidApp.foregroundActivity || androidApp.startActivity;
  const context = activity.getApplicationContext();

  console.log("xxx: ", JSON.stringify(android.content.pm));
  activity.requestPermissions(
    [android.Manifest.permission.READ_EXTERNAL_STORAGE],
    1234 // Código de solicitação
  );

  // const hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
  //     android.content.pm.PackageManager.checkSelfPermission(
  //         context,
  //         android.Manifest.permission.READ_EXTERNAL_STORAGE
  //     );

  // if (!hasPermission) {
  //     activity.requestPermissions(
  //         [android.Manifest.permission.READ_EXTERNAL_STORAGE],
  //         1234 // Código de solicitação
  //     );
  // } else {
  //     console.log("Permissão já concedida.");
  // }
}
