import { EventData, Observable } from "@nativescript/core";

export function onShownModally(args) {
  const context = args.context;
  const page = args.object;
  // const vm = new Observable();

  // vm.set("imageUrl", context.imageUrl); // vem da main Page
  // vm.set("nome", context.nome); // vem da main Page
  page.bindingContext = {
    nome: context.nome,
    imageUrl: "file://" + context.imageUrl,// ou só context.imageUrl se já tiver o file://
    videoUrl: "file://" + context.videoUrl
  };
}
