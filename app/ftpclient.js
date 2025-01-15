

export class FtpClient {
    constructor() {
        var me = this;
        me.client = new it.sauronsoftware.ftp4j.FTPClient();
    }

    connect = async function (url, port) {
        const data = {url, port};
        console.log(data);
        var me = this;
        if (data.port != undefined) {
            return me.client.connect(data.url, data.port);
        } else {
            return me.client.connect(data.url);
        }
    };

    login = async function (username, password) {
        const data = {username, password};
        var me = this;
        return me.client.login(data.username, data.password);
    };
    
    changeDirectory = async function (path) {
        const data = {path};
        var me = this;
        return me.client.changeDirectory(data.path);
    };
    
    upload = async function (path) {
        const data = {path};
        var me = this;
        return me.client.upload(new java.io.File(data.path));
    };

    disconnect = async function () {
        var me = this;
        return me.client.disconnect(true);
    };
    
    list = async function () {
        var me = this;
        var files = me.client.list();
        var fin = [];
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
			//console.log("ftp-worker-android.js/list: ", file);
            fin.push({
                type: (file.getType() == it.sauronsoftware.ftp4j.FTPFile.TYPE_DIRECTORY) ? 'directory' : 'file',
                name: file.getName(),
				mdate: file.getModifiedDate().toString(),
				file: file.toString(),
				size: file.getSize()
            });
        }
        return fin;
    };
    
    download = async function (localFile, file) {
        const data = {localFile, file};
        var me = this;
        var fileOut = new java.io.File(data.localFile);
        return me.client.download(data.file, fileOut);
    };
    
    rename = async function (oldFile, newFile) {
        const data = {oldFile, newFile};
        var me = this;
        return me.client.rename(data.oldFile, data.newFile);
    };
    
    deleteFile = async function (file) {
        const data = {file};
        var me = this;
        return me.client.deleteFile(data.file);
    };
    
    deleteDirectory = async function (directory) {
        const data = {directory};
        var me = this;
        return me.client.deleteDirectory(data.directory);
    };
    
    createDirectory = async function (directory) {
        const data = {directory};
        var me = this;
        return me.client.createDirectory(data.directory);
    };
	
    sendCustomCommand = async function (comando) {
        const data = {comando};
        var me = this;
		//console.log("sendCustomCommand: ", data.comando);
        return me.client.sendCustomCommand(data.comando);
    };
}