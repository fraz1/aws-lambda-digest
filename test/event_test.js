var DigestEvents = require('../index');

// var context = {
//   done: function(error, message) {
//     console.log('done!');
//     process.exit(1);
//   }
// };

describe('Digest Event', function(){
  var eventName = 'Digest Event';

  // before(function() {
  //
  // });
  //
  // after(function() {
  //
  // });

  it('should increment the video view event value', function(done){

    var testObject = {env: 'development'};
    var testContext = {
      succeed: function(error, message) {
        done();
      },
      fail: function(error, message) {
        done();
      }
    };

    DigestEvents.handler(testObject, testContext);


  });
});
