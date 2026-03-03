import { EventData, Observable } from "@nativescript/core";

export function onShownModally(args) {
  const context = args.context;
  const page = args.object;
  // const vm = new Observable();

  // vm.set("imageUrl", context.imageUrl); // vem da main Page
  // vm.set("nome", context.nome); // vem da main Page
  page.bindingContext = {
    nome: context.nome || "Visualização",
    imageUrl: context.imageUrl ? "file://" + context.imageUrl : null,
    videoUrl: context.videoUrl ? "file://" + context.videoUrl : null
  };
}

export function onClose(args) {
  args.object.page.closeModal();
}
