import { DataUtils } from "./datautils";

export class FiltroUtils {
    static quantidade(param) {
        let cont = parseInt(param.valor);
        for (let item of param.entrada) {
            if (item[param.atributos.nome] == param.atributos.valor) {
            cont--;
            if (cont >= 0) {
                param.saida.push(item);
                // item.selecionado = true;
            } else {
                break;
            }
            }
        }
    }

    static dataMenor(param) {
        let dataFiltro = DataUtils.parseData(param.valor, "dd/MM/yyyy");
        for (let item of param.entrada) {
            if (item[param.atributos.nome] == param.atributos.valor) {
                if (item[param.attr] < dataFiltro) {
                    param.saida.push(item);
                    // item.selecionado = true;
                }
            }
        }
    }
}