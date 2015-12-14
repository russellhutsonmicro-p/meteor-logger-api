LogEntries = new Mongo.Collection('log_entries');

Schemas = {};

Schemas.LogEntries = new SimpleSchema({
  request: {
    type: Object,
    blackbox: true // see http://stackoverflow.com/questions/29464393/storing-arbitrary-object-inside-a-field-with-meteor-simple-schema
  },
  content: {
    type: Object,
    blackbox: true
  },

  sessionId: {
    type: String,
  },

  createdAt: {
    type: Date,
    label: 'Date',
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    }
  }
  /*
  owner: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue: function () {
      if (this.isInsert) {
        return Meteor.userId();
      }
    },
    autoform: {
      options: function () {
        _.map(Meteor.users.find().fetch(), function (user) {
          return {
            label: user.emails[0].address,
            value: user._id
          };
        });
      }
    }
  }
  */
});

LogEntries.attachSchema(Schemas.LogEntries)


if (Meteor.isServer) {
  console.log('Creating API');
  ApiV1 = new Restivus({
    useDefaultAuth: false,
    version: 'v1',
    prettyJson: true,
    enableCors: true
  });

  console.log("Installing LogEntries endpoints");

  ApiV1.addCollection(LogEntries

    
    , {
    	excludedEndpoints: ['get', 'put', 'delete'],
    
	        endpoints: {
            post: {
	        	  authRequired: false,
	            action: function () {
                console.log('bodyParams: '+JSON.stringify(this.bodyParams)); 
                request = {ip: this.request.connection.remoteAddress};
                
                sessionId = this.bodyParams.sessionId;
                delete this.bodyParams.sessionId;
                console.log('bodyParams: '+JSON.stringify(this.bodyParams)); 

                 if (this.bodyParams.text) {
                  content = {text: this.bodyParams.text};
                 } else {
                  content = this.bodyParams; // object
                 }
                  newrecord = {request: request, "content": content, "sessionId": sessionId};
                  console.log('Attempting to insert '+JSON.stringify(newrecord));

                  if (LogEntries.insert(newrecord)) {
	                   console.log ("Inserted " + newrecord);
                     return {status: 'success', data: {message: 'Log Entry Inserted'}};
                  } else {
                    return {
                      statusCode: 404,
                      body: {status: 'fail', message: 'Article not found'}
                    };
                  }
	            }
	         }
         }
		        
	}
  
	);
} // if