$(function(){

    // artificially limit the message size
    var maxMessageSize = 1000;

    var body = $('body'),
		stage = $('#stage'),
        back = $('a.back');
        
    /* Step 1 */

	$('#step1 .encrypt').click(function(){
		body.attr('class', 'encrypt');

		// Go to step 2
		step(2);
    });
    
    $("#step2 .button").click(function(){
        $(this).parent().find('input').click();
    });

    // Set up events for the file inputs

    
    $('#step2').on('change', '#encrypt-input', function(e){

        // Has a file been selected?

		if(e.target.files.length!=1){
			alert('Please select a pic to encrypt!');
			return false;
        }

        var reader = new FileReader();
        //reader = e.target.files[0];

        if(reader.size > 1024*1024){
			alert('Please choose pictures smaller than 1mb, otherwise you may crash your browser. \nThis is a known issue. See the tutorial.');
			return;
        }

        reader.onload = function(event) {
            // read the data into the canvas element
            var img = new Image();
            img.onload = function() {
                var ctx = document.getElementById('canvas').getContext('2d');
                ctx.canvas.width = img.width;
                ctx.canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                //decode();
            };
            img.src = event.target.result;
        }

        reader.readAsDataURL(e.target.files[0]);
        step(3);
    });

    $('a.button.process').click(function(){

        var input = $(this).parent().find('input[type=password]'),
            messageInput = $(this).parent().find('textarea'),
			a = $('#step4 a.download'),
            password = input.val(),
            message = messageInput.val();
            output = document.getElementById('output');
            canvas = document.getElementById('canvas');
            ctx = canvas.getContext('2d');

        messageInput.val('');
        input.val('');

        // encrypt the message with supplied password if necessary
        if (password.length > 0) {
            message = sjcl.encrypt(password, message);
        } else {
            message = JSON.stringify({'text': message});
        }

        // exit early if the message is too big for the image
        var pixelCount = ctx.canvas.width * ctx.canvas.height;
        if ((message.length + 1) * 16 > pixelCount * 4 * 0.75) {
            alert('Message is too big for the image.');
            return;
        }
        
        // exit early if the message is above an artificial limit
        if (message.length > maxMessageSize) {
            alert('Message is too big.');
            return;
        }

        // encode the encrypted message with the supplied password
        var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        encodeMessage(imgData.data, sjcl.hash.sha256.hash(password), message);
        ctx.putImageData(imgData, 0, 0);

        // view the new image
        output.src = canvas.toDataURL();
        step(4);

    });

    // returns a 1 or 0 for the bit in 'location'
    var getBit = function(number, location) {
        return ((number >> location) & 1);
    };
    
    // sets the bit in 'location' to 'bit' (either a 1 or 0)
    var setBit = function(number, location, bit) {
        return (number & ~(1 << location)) | (bit << location);
    };
    
    // returns an array of 1s and 0s for a 2-byte number
    var getBitsFromNumber = function(number) {
        var bits = [];
        for (var i = 0; i < 16; i++) {
            bits.push(getBit(number, i));
        }
        return bits;
    };
    
    // returns the next 2-byte number
    var getNumberFromBits = function(bytes, history, hash) {
        var number = 0, pos = 0;
        while (pos < 16) {
            var loc = getNextLocation(history, hash, bytes.length);
            var bit = getBit(bytes[loc], 0);
            number = setBit(number, pos, bit);
            pos++;
        }
        return number;
    };

    // returns an array of 1s and 0s for the string 'message'
    var getMessageBits = function(message) {
        var messageBits = [];
        for (var i = 0; i < message.length; i++) {
            var code = message.charCodeAt(i);
            messageBits = messageBits.concat(getBitsFromNumber(code));
        }
        return messageBits;
    };

    // gets the next location to store a bit
    var getNextLocation = function(history, hash, total) {
        var pos = history.length;
        var loc = Math.abs(hash[pos % hash.length] * (pos + 1)) % total;
        while (true) {
            if (loc >= total) {
                loc = 0;
            } else if (history.indexOf(loc) >= 0) {
                loc++;
            } else if ((loc + 1) % 4 === 0) {
                loc++;
            } else {
                history.push(loc);
                return loc;
            }
        }
    };

    // encodes the supplied 'message' into the CanvasPixelArray 'colors'
    var encodeMessage = function(colors, hash, message) {
        // make an array of bits from the message
        var messageBits = getBitsFromNumber(message.length);
        messageBits = messageBits.concat(getMessageBits(message));

        // this will store the color values we've already modified
        var history = [];

        // encode the bits into the pixels
        var pos = 0;
        while (pos < messageBits.length) {
            // set the next color value to the next bit
            var loc = getNextLocation(history, hash, colors.length);
            colors[loc] = setBit(colors[loc], 0, messageBits[pos]);

            // set the alpha value in this pixel to 255
            // we have to do this because browsers do premultiplied alpha
            // see for example: http://stackoverflow.com/q/4309364
            while ((loc + 1) % 4 !== 0) {
                loc++;
            }
            colors[loc] = 255;

            pos++;
        }
    };

    back.click(function(){

		// Reinitialize the hidden file inputs,
		// so that they don't hold the selection 
		// from last time

		$('#step2 input[type=file]').replaceWith(function(){
			return $(this).clone();
		});

		step(1);
	});

   // Helper function that moves the viewport to the correct step div

	function step(i){

		if(i == 1){
			back.fadeOut();
		}
		else{
			back.fadeIn();
		}

		// Move the #stage div. Changing the top property will trigger
		// a css transition on the element. i-1 because we want the
		// steps to start from 1:

		stage.css('top',(-(i-1)*100)+'%');
	}
});