

function copyDatabaseFile(dbName) {

    var sourceFileName = cordova.file.externalDataDirectory + dbName;
    var targetDirName = cordova.file.dataDirectory;

    return Promise.all([
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(sourceFileName, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            resolveLocalFileSystemURL(targetDirName, resolve, reject);
        })
    ]).then(function (files) {
        var sourceFile = files[0];
        var targetDir = files[1];
        return new Promise(function (resolve, reject) {
            targetDir.getFile(dbName, {}, resolve, reject);
        }).then(function () {
            console.log("file already copied");
        }).catch(function () {
            console.log("file doesn't exist, copying it");

            return new Promise(function (resolve, reject) {
                sourceFile.copyTo(targetDir, dbName, resolve, reject);
            }).then(function () {
                console.log("database file copied");
            });
        });
    });
}