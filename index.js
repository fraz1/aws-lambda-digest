var aws = require('aws-sdk');
var pg = require('pg');

var envConfig = require('./env.json');

exports.handler = function(event, context) {
  console.log(event);
  var env = 'production';
  var config = envConfig[env];
  run(deliverCallback);

  function run(callback) {
    var db = new pg.Client(config.DB_CONN);
    var data = {range: 'Last 24 hours'};
    console.log('connecting to DB...');
    db.connect(function(err) {
      if(err) {
        return context.fail('DB Error could not connect to postgres: ' + err);
      }
      db.query("select count(*) as tot from integrations where created_at  > (now() - interval '24 hour')", function(err, result) {
        if(err) {
          return context.fail('DB Error running query: ' + err);
        }
        data.integrations = result.rows[0].tot;
      });
      db.query("select count(*) as tot from users where created_at  > (now() - interval '24 hour')", function(err, result) {
        if(err) {
          return context.fail('DB Error running query: ' + err);
        }
        data.users = result.rows[0].tot;
      });
      db.query("select count(*) as tot from companies where created_at  > (now() - interval '24 hour')", function(err, result) {
        if(err) {
          return context.fail('DB Error running query: ' + err);
        }
        data.companies = result.rows[0].tot;
      });
      db.query("select count(*) as tot from collaborators where created_at  > (now() - interval '24 hour')", function(err, result) {
        if(err) {
          return context.fail('DB Error running query: ' + err);
        }
        data.collaborators = result.rows[0].tot;
      });
      db.query("select count(*) as tot from jobs where created_at  > (now() - interval '24 hour')", function(err, result) {
        if(err) {
          return context.fail('DB Error running query: ' + err);
        }
        data.jobs = result.rows[0].tot;
        db.end();
        callback(data);
      });

    });
  }

  function deliverCallback(data){
    console.log('sending to Postmark...');
    var postmark = require("postmark");
    var client = new postmark.Client(config.POSTMARK_SERVER_KEY);

    client.sendEmailWithTemplate({
      "From": config.POSTMARK_FROM_ADDRESS,
      "To": "team@hellohired.com",
      "TemplateId": config.POSTMARK_TEMPLATE_ID,
      "TemplateModel": data
    }, postmarkResponse);
  }

  function postmarkResponse(error, success){
    if(error) {
        console.log("Unable to send via postmark: " + error.message);
        return context.fail("Unable to send via postmark: " + error.message);
    }
    console.log("Sent to postmark for delivery");
    context.succeed('Done!!');
  }
};
