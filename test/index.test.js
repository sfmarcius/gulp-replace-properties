const chai = require('chai');
const chaiExclude = require('chai-exclude');
chai.use(chaiExclude);
const expect = chai.expect;
const fs = require('fs-extra');
const File = require('vinyl');
const replacer = require("../src/index");

function doTest(targetFunction, targetArgs, testFilename, doneCallback) {
    let inputFile = new File({ path: `test/fixtures/${testFilename}`, contents: fs.readFileSync(`test/fixtures/${testFilename}`) });
    let expectedContent = fs.readFileSync(`test/expected/${testFilename}`, 'utf8');
    let check = function (stream, done, cb) {
        stream.on('data', function (newFile) {
            cb(newFile);
            done();
        });
        stream.write(inputFile);
        stream.end();
    };
    var stream = targetFunction.apply(null, targetArgs);
    check(stream, doneCallback, function (outputFile) {
        let actualContent = String(outputFile.contents);
        expect(actualContent).to.equal(expectedContent);
    });
}

describe('gulp-replacer', () => {
    let props = {
        user1: "Java",
        user2: "PHP",
        user3: "Javascript",
        user4: "TypeScript",
    };
    let tests = [
        ["test_01.txt", replacer.replaceProps, [props]],
        ["test_02.txt", replacer.replace, [/\d+/, "ABC"]],
        ["test_03.txt", replacer.replace, [/ABC/, "123"]],
        ["test_03.txt", replacer.replace, [/abc/, "123", {caseSensitive: false}]],
        ["test_04.txt", replacer.replace, ["{greet}", "Hello"]],
        ["test_04.txt", replacer.replace, ["{GREET}", "Hello", {caseSensitive: false}]]
    ];

    tests.forEach(testparams => {
        it(`replace fixtures/${testparams[0]}`, (doneCallback) => {
            doTest(testparams[1], testparams[2], testparams[0], doneCallback);
        });
    });
});
