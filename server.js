const https = require('https');

function accessRepository(options) {
  return new Promise(
    function (resolve, reject) {
      console.log("Requesting to:", options);
      let data = '';

      https.get(options, (res) => {
        // console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });

      }).on("error", (err) => {
        reject(err);
      });
    });
}

function getTreeListId(data){
  const regex = /\/tree-list\/[aA0-zZ9]*/ig;
  let m;

  while ((m = regex.exec(data)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
          regex.lastIndex++;
      }
      
      return(m[0].replace('/tree-list/',''));
  }
}

function getFileInfos(file, path){
  return new Promise(
    function (resolve, reject) {

      let name, lines, size, extension;

      const regex = /<div class="text-mono f6 flex-auto pr-3 flex-order-2 flex-md-order-1">[\n\s]*([0-9]*\slines)[\s\([aA-zZ0-9\)]*]*<span class="file-info-divider"><\/span>[\s\n]*([0-9\.]*\s[aA-zZ]*)/m;

      let m;
      if ((m = regex.exec(file)) !== null) {
        lines = m[1]
        size = m[2];
      }

      //gif, png, jpeg...
      if(m == null){
        const regex = /<div class="text-mono f6 flex-auto pr-3 flex-order-2 flex-md-order-1">[\s\n]*([0-9\.]*\s[aA-zZ]*)/m;
        let m;
        if ((m = regex.exec(file)) !== null) {
          size = m[1];
        } 
      }

      let pathSplitted = path.split('/');
      nameAndExtension = pathSplitted[pathSplitted.length-1].split('.');

      name = nameAndExtension[0];
      extension = nameAndExtension[1];

      resolve ({path, name, lines, size, extension});

  });
  
}

async function mainFunction() {

  if (process.argv.length != 4) {
    console.log("Wrong Parameters\nUsage: node server.js [repository_name] [branch]\nExample: node server.js TheAlgorithms/Java master");
    process.exit(0);
  }

  let hostname = 'github.com';
  let repositoryName = process.argv[2];
  let branch = process.argv[3];

  let data = await accessRepository('https://'+hostname+'/'+repositoryName+'/find/'+branch);
  let treeListId = getTreeListId(data);

  let options = {
    'method': 'GET',
    'hostname': hostname,
    'path': '/'+repositoryName+'/tree-list/'+treeListId,
    'headers': {
      'X-Requested-With': 'XMLHttpRequest'
    },
  };
   
  let treeList = await accessRepository(options);
  let treeListJson = JSON.parse(treeList);

  console.log("TREELIST: ");
  console.log(treeListJson);

  treeListJson.paths.forEach( async (file) =>{
    let data = await accessRepository('https://'+hostname+'/'+repositoryName+'/blob/'+branch+'/'+file);
    let fileInfo = await getFileInfos(data, 'https://'+hostname+'/'+repositoryName+'/blob/'+branch+'/'+file);
    console.log("FILEINFO: ");
    console.log(fileInfo);
  });

}

mainFunction();
