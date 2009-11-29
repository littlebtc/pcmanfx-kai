// Main Program

function PCMan() {
    var canvas = document.getElementById("canvas");
    this.conn=new Conn(this);
    this.view=new TermView(canvas);
    this.buf=new TermBuf(80, 24);
    this.buf.setView(this.view);
    this.view.setBuf(this.buf);
    this.view.setConn(this.conn);
    this.parser=new AnsiParser(this.buf);
    this.stringBundle = document.getElementById("pcman-string-bundle");
}

PCMan.prototype={

    connect: function(url) {
        var parts = url.split(':');
        var port = 23;
        if(parts.length > 1)
            port=parseInt(parts[1], 10);
        this.conn.connect(parts[0], port);
    },
    
    close: function() {
        this.conn.close();
    },

    onConnect: function(conn) {
    },

    onData: function(conn, data) {
        //alert('data('+data.length +') ' +data);
        this.parser.feed(data);
        //alert('end data');
    },

    onClose: function(conn) {
        alert(this.stringBundle.getString("alert_conn_close"));
    },
    
    copy: function(){
        alert('Not yet supported');
    },

    paste: function() {
        if(this.conn) {
            // From: https://developer.mozilla.org/en/Using_the_Clipboard
            var clip = Components.classes["@mozilla.org/widget/clipboard;1"]
                            .getService(Components.interfaces.nsIClipboard);
            if(!clip)
                return false;
            var trans = Components.classes["@mozilla.org/widget/transferable;1"]
                            .createInstance(Components.interfaces.nsITransferable);
            if (!trans)
                return false;
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);
            var data={};
            var len={};
            trans.getTransferData("text/unicode", data, len);
            if(data && data.value) {
                var s=data.value.QueryInterface(Components.interfaces.nsISupportsString);
                s = s.data.substring(0, len.value / 2);  
                s=s.replace(/\r\n/g, '\r');
                s=s.replace(/\n/g, '\r');
                this.conn.convSend(s, 'big5');
            }
        }
    },
    
    selAll: function() {
        alert('Not yet supported');
    },

    //Here comes mouse events

    //click to open in a new tab
    click: function(event) {
        var relX = event.pageX - this.view.canvas.offsetLeft;
        var relY = event.pageY - 0;
        var PosX = (relX - relX % this.view.chw) / this.view.chw;//too slow?
	var PosY = (relY - relY % this.view.chh) / this.view.chh;
	var uris = this.buf.lines[PosY].uris;
	if (!uris) return;
	for (var i=0;i<uris.length;i++){
	  if (PosX >= uris[i][0] && PosX < uris[i][1]){ //@ < or <<
	    var uri = "";
	    for (var j=uris[i][0];j<uris[i][1];j++)
	      uri = uri + this.buf.lines[PosY][j].ch;
	    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
	    var gBrowser = wm.getMostRecentWindow("navigator:browser").gBrowser;
	    gBrowser.selectedTab = gBrowser.addTab(uri);

	  }
	}
  },
    //detect current location and change mouse cursor  
    mousemove: function(event) {
        var relX = event.pageX - this.view.canvas.offsetLeft;
        var relY = event.pageY - 0;
        var PosX = (relX - relX % this.view.chw) / this.view.chw;//too slow?
	var PosY = (relY - relY % this.view.chh) / this.view.chh;
	var uris = this.buf.lines[PosY].uris;
	if (!uris) {
	  this.view.canvas.style.cursor = "default";
	  return;
	}
	for (var i=0;i<uris.length;i++){
	  if (PosX >= uris[i][0] && PosX < uris[i][1]){ //@ < or <<
	    this.view.canvas.style.cursor = "pointer";
	    return
	  }
	}
	this.view.canvas.style.cursor = "default";
  }
}
