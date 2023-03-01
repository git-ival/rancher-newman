const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');
const commander = require('commander');

commander
  .usage('[OPTIONS]...')
  .option('-i, --info <value>', 'The path to a json file containing the desired node\'s information.', '')
  .parse(process.argv);

const options = commander.opts();

console.log(options);

const INFO_PATH = (options.info ? options.info : new Error("Missing --info option!"));
// TODO: Add support for passing a list of node info paths by wrapping everything required for a run in a INFO_PATH.forEach().

const ssh = new NodeSSH();
var NATIVE_DIFF_OVERLAY = false;
var OVERLAYFS_STORAGE_DRIVER = "overlay2";
var NODES_INFO = [];

set_nodes_info(INFO_PATH);
configure_nodes();

async function configure_nodes() {
  for (var node of NODES_INFO) {
    console.log(node.machine_name);
    await ssh.connect({
      host: node.address,
      username: 'ubuntu',
      privateKeyPath: node.ssh_key_path
    }).then(() => ssh.putFile("./toggle_native_overlay_diff.sh", '/home/ubuntu/toggle_native_overlay_diff.sh')
        .then(() => console.log("Done uploading file."), (error) => console.log(error)))
      .then(() => ssh.execCommand(`sudo su -c "sh /home/ubuntu/toggle_native_overlay_diff.sh ${NATIVE_DIFF_OVERLAY} ${OVERLAYFS_STORAGE_DRIVER}"`)
        .then(() => console.log("Done running script."), (error) => console.log(error)), (error) => console.log(error))
      .then(() => ssh.dispose())
      .then(() => console.log("Closing ssh connection."), (error) => console.log(error));
  }
}

function set_nodes_info(filePath) {
  try {
    const envVars = JSON.parse(fs.readFileSync(filePath));
    NODES_INFO = envVars.NODES_INFO;
  } catch (e) {
    console.log(e);
  }
}
