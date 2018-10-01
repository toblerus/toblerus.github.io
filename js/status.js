        $.ajax({
            //your server url
            url: "minecraft.einfachtobi.com",
            type: "post",
            data: "onlinecheck",
            success: function(){
                //function if server's online
                document.getElementById("divtodiplaystatus").innerHTML = "Server is online!";
            },
            error:function(){
                //function if server's offline
                document.getElementById("divtodiplaystatus").innerHTML = "Server is offline :(!";
            }
        });