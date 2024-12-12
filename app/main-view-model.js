import { Observable } from '@nativescript/core';
import { FtpClient } from 'nativescript-ftp-client';

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
  return viewModel;
}
