# rancher-newman

## What is this for?
This is a collection of convenience scripts written in `bash` or `nodejs` utilizing postman collections and the `newman` API library.

### Available Scripts
- `get_nodes_info.js`
  - Runs the included postman Collection and Environment using `newman` to collect node ssh keys, their public IP addresses and their Rancher machine names into a json file.
  - Example: `node get_nodes_info.js --url <my rancher url> --token <my rancher token> --cluster <my cluster ID> --username <my admin username> --password <my admin password>`
- `get_nodes_info_per_downstream.sh`
  - Runs `get_nodes_info.js`, but allows passing in a list of cluster IDs
  - Arguments are positional
  - Example: `./get_nodes_info_per_downstream.sh <my rancher url> <my rancher token> <my admin username> <my admin password> <cluster1-ID cluster2-ID ... clusterN-ID>`
- `set_native_diff_overlay.js`
  - Takes in a path to the nodes-info.json file output by `get_nodes_info.js` then SSH-es into each node and runs the `toggle_native_overlay_diff.sh` script on them
- `install_kvm_ubuntu.js`
  - Takes in a path to the nodes-info.json file output by `get_nodes_info.js` then SSH-es into each node and runs the `install_kvm_ubuntu.sh` script on them

### Setup
1. Navigate to the `rancher-newman/` root directory
2. Install [LTS](https://confluence.suse.com/display/RANQA/Postman) version of node
3. Run `npm install`
