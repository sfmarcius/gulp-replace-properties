const chai = require('chai');
const chaiExclude = require('chai-exclude');
chai.use(chaiExclude);
const expect = chai.expect;
const fs = require('fs-extra');
const File = require('vinyl');

const replacer = require("../src/index");

describe('gulp-replacer', () => {
    const options = {
//        logLevel: 10
    };

    it("replace fixtures/testprops.txt", (done) => {
        let props = {
            user1: "Java",
            user2: "PHP",
            user3: "Javascript",
            user4: "TypeScript",
        }
        let file = new File({ path: 'test/fixtures/testprops.txt', contents: fs.readFileSync('test/fixtures/testprops.txt') });
        let check = function (stream, done, cb) {
            stream.on('data', function (newFile) {
                cb(newFile);
                done();
            });
            stream.write(file);
            stream.end();
        };
        var stream = replacer.replaceProps(props, options);
        check(stream, done, function (newFile) {
            let actual = String(newFile.contents);
            let target = fs.readFileSync('test/expected/testprops.txt', 'utf8');
            expect(actual).to.equal(target);
        });
    });

    it("replace fixtures/testregex.txt", (done) => {
        let file = new File({ path: 'test/fixtures/testregex.txt', contents: fs.readFileSync('test/fixtures/testregex.txt') });
        let check = function (stream, done, cb) {
            stream.on('data', function (newFile) {
                cb(newFile);
                done();
            });
            stream.write(file);
            stream.end();
        };
        var stream = replacer.replace(/\d+/, "ABC", options);
        check(stream, done, function (newFile) {
            let actual = String(newFile.contents);
            let target = fs.readFileSync('test/expected/testregex.txt', 'utf8');
            expect(actual).to.equal(target);
        });
    });

    it("replace fixtures/teststr.txt", (done) => {
        let file = new File({ path: 'test/fixtures/teststr.txt', contents: fs.readFileSync('test/fixtures/teststr.txt') });
        let check = function (stream, done, cb) {
            stream.on('data', function (newFile) {
                cb(newFile);
                done();
            });
            stream.write(file);
            stream.end();
        };
        var stream = replacer.replace("{greet}", "Hello", options);
        check(stream, done, function (newFile) {
            let actual = String(newFile.contents);
            let target = fs.readFileSync('test/expected/teststr.txt', 'utf8');
            expect(actual).to.equal(target);
        });
    });
});
