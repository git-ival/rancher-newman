const newman = require('newman'); // require newman
const fs = require('fs'); //require filesystem lib
// For unzipping:
var path = require('path');
const JSZip = require('jszip');
const { Parse } = require('unzipper');

const commander = require('commander');

commander
  .usage('[OPTIONS]...')
  .option('-w, --url <value>', 'The Rancher cluster\'s url.', '')
  .option('-t, --token <value>', 'The Rancher cluster\'s token key.', '')
  .option('-c, --cluster <value>', 'ID of the cluster to operate on', '')
  .option('-u, --username <value>', 'The Rancher cluster\'s admin username.', '')
  .option('-p, --password <value>', 'The Rancher cluster\'s admin password.', '')
  .parse(process.argv);

const options = commander.opts();

console.log(options);

const URL = (options.url ? options.url : new Error("Missing --url option!"));
const RANCHER_TOKEN_KEY = (options.token ? options.token : new Error("Missing --token option!"));
const CLUSTER_ID = (options.cluster ? options.cluster : new Error("Missing --cluster option!"));
const USERNAME = (options.username ? options.username : new Error("Missing --cluster option!"));
const PASSWORD = (options.password ? options.password : new Error("Missing --cluster option!"));
// TODO: Add support for passing a list of cluster IDs by wrapping everything required for a run in a CLUSTER_ID.forEach().

const collectionName = "Machine Keys";
let content = "";
var nodesInfo = [];
const keysDir = `./node-keys-${CLUSTER_ID}`;
const nodeInfoDir = `./node-info-${CLUSTER_ID}.json`;
const defaultEnvVars = JSON.stringify({});

fs.writeFileSync(nodeInfoDir, defaultEnvVars);

if (fs.existsSync(keysDir)) {
  fs.rmSync(keysDir, { recursive: true });
}
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}
// call newman.run to pass `options` object and wait for callback
var emitter = newman.run({
  collection: require('../collections-and-envs/Rancher-GetMachineKeys.postman_collection.json'),
  environment: require('../collections-and-envs/RancherEnv.postman_environment.json'),
  envVar: [
    {
      key: "URL",
      value: URL
    },
    {
      key: "RANCHER_TOKEN_KEY",
      value: RANCHER_TOKEN_KEY
    },
    {
      key: "CLUSTER_ID",
      value: CLUSTER_ID
    }
  ],
  reporters: 'cli'
});

var onTestRequest = new Promise(function (resolve) {
  emitter.on('request', (error, data) => {
    if (error) {
      return console.error(error);
    }
    if (data.item.name == collectionName) {
      content = data.response.stream;
      // console.log(data.response.stream.toString());
    }
    if (data.item.name == "Nodes Info") {
      content = JSON.parse(data.response.stream.toString());
    }
  }).on('test', async (error, data) => {
    if (error) {
      return console.error(error);
    }
    if (data.item.name == collectionName) {
      const filePath = path.resolve(path.join(keysDir, `${data.executions[0].result.environment.values.reference.MACHINE_NAME.value}-keys.zip`));

      writeStream(filePath, content).then(function (result) {
        return result;
      }).then(function (result) {
        return unzipAsync(filePath, keysDir);
      }).then(function (result) {
        // Set the machine name and ssh key path for each node
        nodesInfo.push({
          "machine_name": CLUSTER_ID + ":" + data.executions[0].result.environment.values.reference.MACHINE_NAME.value,
          "address": "",
          "ssh_key_path": path.join(result, "/id_rsa"),
        });
        var nodeEnvVars = JSON.parse(fs.readFileSync(nodeInfoDir));
        nodeEnvVars.NODES_INFO = nodesInfo;
        nodeEnvVars = JSON.stringify(nodeEnvVars);
        fs.writeFileSync(nodeInfoDir, nodeEnvVars);
      }).then(function (result) {
        deleteFiles(filePath);
      });
    }
  });
});

var onDone = new Promise(function (resolve) {
  emitter.on('done', (error, data) => {
    if (error) {
      return console.error(error);
    }
    chmodDirPromise(keysDir, "0600");

    // Set the address for each node
    let tempNode = "";
    content.items.forEach(item => {
      tempNode = nodesInfo.find(node => node.machine_name === item.status.rkeNode.nodeName);
      nodesInfo[nodesInfo.indexOf(tempNode)].address = item.status.rkeNode.address;
    })
    var nodeEnvVars = JSON.parse(fs.readFileSync(nodeInfoDir));
    nodeEnvVars.NODES_INFO = nodesInfo;
    nodeEnvVars = JSON.stringify(nodeEnvVars);
    fs.writeFileSync(nodeInfoDir, nodeEnvVars);
  });
});

function writeStream(filePath, content) {
  // write the zip file locally as a stream so that it is a fully valid .zip
  const writableStream = fs.createWriteStream(filePath);
  writableStream.write(content);
  writableStream.end();
  return streamToPromise(writableStream);
}

function streamToPromise(stream) {
  return new Promise(function (resolve, reject) {
    // resolve with location of saved file
    stream.on("finish", () => resolve(stream.path));
    stream.on("error", reject);
  })
}

function unzip(basePath, filePath) {
  console.log(`file PATH: ${filePath}`);
  const stream = fs.createReadStream(filePath).pipe(Parse());

  return new Promise((resolve, reject) => {
    stream.on('entry', (entry) => {
      console.log(`ENTRY PATH: ${entry.path}`);
      const writeStream = fs.createWriteStream(basePath + entry.path);
      return entry.pipe(writeStream);
    });
    stream.on("end", () => resolve(stream.dests[0].path));
    stream.on("error", reject);
  });
}

async function unzipAsync(filePath, dest) {
  const zipContents = fs.readFileSync(filePath);
  var zip = new JSZip();

  const unzipResult = await zip.loadAsync(zipContents);

  const keys = Object.keys(unzipResult.files);
  let dir = "";
  for (let key of keys) {
    const item = unzipResult.files[key];
    dir = path.resolve(path.join(dest, path.dirname(item.name)));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // write the file to the newly created dir
    var writeDir = path.resolve(path.join(dest, item.name));
    fs.writeFileSync(writeDir, Buffer.from(await item.async('arraybuffer')));
  }
  return dir;
}

function chmodDirPromise(dir, mode) {
  const readDir = fs.readdirSync(dir);

  return new Promise((resolve, reject) => {
    readDir.forEach(currPath => {
      var filePath = path.resolve(path.join(dir, currPath));
      const isDirectory = fs.statSync(filePath).isDirectory();
      const isFile = fs.statSync(filePath).isFile();
      if (isDirectory) {
        return chmodDirPromise(filePath, mode);
      } else if (isFile) {
        fs.chmodSync(filePath, mode);
        return;
      }
      reject(new Error("Could not find Directory or File for chmod!"));
    });
  });
}

function deleteFiles(filePath) {
  return fs.rmSync(filePath)
}
