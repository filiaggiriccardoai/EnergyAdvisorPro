const {app,BrowserWindow}=require('electron');
const path=require('node:path');
function createWindow(){const w=new BrowserWindow({width:1440,height:960,minWidth:1000,minHeight:720,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});w.setMenuBarVisibility(false);w.loadFile(path.join(__dirname,'../dist/index.html'));w.webContents.setWindowOpenHandler(()=>({action:'deny'}));}
app.whenReady().then(createWindow);
app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
