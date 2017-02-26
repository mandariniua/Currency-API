/**
 * Created by Коля on 26.02.2017.
 */
var fs = require('fs');
var path = require('path');
var request = require('request').defaults({maxRedirects:1000000});
var currency = null;

function getCurrency(callback) {
    // fs.readFile(path.join(__dirname,'data/currency-cash.json'),'utf8', function(err, contents) {
    //     if(err){
    //         return callback(err);
    //     }
    //
    //     var obj = JSON.parse(contents);
    //     callback(null, obj);
    // });
    if(currency){
        return callback(null, currency);
    }
    request('http://resources.finance.ua/ua/public/currency-cash.json', function (error, response, body) {
        if(error){
            return callback(error)
        }
        var obj = JSON.parse(body);
        currency = obj;
        callback(null, currency);
    });
}


function getCurrencyUAH(callback) {
    getCurrency(function (err, content) {
        if(err){
            return callback(err);
        }

        var list = content.currencies;
        callback(null, list);
    })
}

function convertInBank(bank, sum, from, to) {
    var sumInUa = 0;
    if(from === 'UAH'){
        sumInUa = sum;
    } else {
        var fromInfo = bank.currencies[from];
        if(!fromInfo){
            return null;
        } else{
            sumInUa = sum* fromInfo.bid;
        }

    }
    var result = 0;
    if(to === 'UAH'){
        result = sumInUa;
    } else {
        var toInfo = bank.currencies[to];
        if(!toInfo){
            return null;
        } else{
            result = sumInUa/toInfo.ask;
        }
    }
    return {
        result:result,
        bank:{
            orgType:bank.orgType == 1 ? 'Банк':'Обмінник',
            title: bank.title,
            phone:bank.phone,
            address:bank.address
        }
    }

}

function convertInBanks(banks, sum, from, to) {
    var result =[];
    for(var i = 0; i <banks.length; i++){
        var bankResult = convertInBank(banks[i], sum, from, to);
        if(bankResult){
            result.push(bankResult);
        }
    }
    result.sort(function (a, b) {
        return b.result - a.result;
    })
    return result;
}

function convert(req, res) {
    var from = req.params.from;
    var to = req.params.to;
    var sum = req.query.sum;

    getCurrency(function (err, content) {
        if(err){
            console.error(err);
            res.status(500).send('Something broke!');
            return;
        }
        var result = convertInBanks(content.organizations,sum,from,to);
        res.send(result);

    });

}
exports.convert = convert;



