import * as loopback from 'loopback';
import * as boot from 'loopback-boot';
import * as dotEnv from "dotenv";
import * as path from "path"
import * as prompt from "prompt"

let configPath = path.join(__dirname,"./config/.env")
dotEnv.config({path: configPath});

var app = module.exports = loopback();

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    console.log(`Connected to db: ${process.env.DB_HOST}`)
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }

    if (process.env.AUTO_MIGRATE == "true") {
      autoMigrateValidate();
    } else {
      autoUpdate([]);
    }
  });
};

var autoUpdate = (tables:string[]): void => {
  let ds = getDataSource();
  //if tables list is not supplied - try and extract them from datasource
  if(!tables || tables.length==0){
    tables = getTablesFromDataSource(ds)
  }
  console.log(`Starting autoupdate of tables into database ${ds.connector.settings.database}`)
  ds.autoupdate(tables, err => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Completed auto update of tables: ${tables.join(', ')}.`)
  }
});
}
var getDataSource=():any=>{
  return app['datasources'][Object.keys(app['datasources'])[0]];
}

var getTablesFromDataSource=(ds):string[]=>{
  let modelnames = Object.keys(ds.models);
  let tables = modelnames.filter(modelname=>{
    let model = ds.models[modelname]
    if(model && model.dataSource){
    return true
  }else{
    return false
  }
})
  return tables
}

var autoMigrateValidate = () => {
  prompt.start()
  prompt.get([{name:"reply",description:"You are about to automigrate database. This will delete your db and recreate it. Do you wish to continue? (y/n)"}], (err, res) => {
    if (res.reply == "y") {
    autoMigrateAction()
  } else {
    console.log("skipping automigrate")
  }
})
}

var autoMigrateAction = () => {
  const ds: any = app['datasources'][Object.keys(app['datasources'])[0]];
  ds.automigrate(async () => {
    await createData(ds);
  console.log("auto migrate completed");
})

}

//If required to load data when intializing db
var createData = async (ds) => {
  //await ds.models.role.create({id: 1, name: "SuperAdmin"});
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
