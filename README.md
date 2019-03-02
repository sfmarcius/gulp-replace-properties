# gulp-replacer

Gulp plugin that replaces properties on text files, much like apache ant's filtering tool.

# Usage

First, install the plugin as a dev dependency:
```
    npm install --save-dev gulp-replacer
```

Then you can start using it, as follows:
```javascript
    const replacer = require("gulp-replacer");

    gulp.task('replace', function () {
        gulp.src(['src/**/*.js'])
            .pipe(replacer.replaceProps({ prop1: "Test prop", prop2: "Another test prop" }))
            .pipe(gulp.dest('build/'));
    });
```

This example will replace every ocurrency of `#[[prop1]]` and  `#[[prop2]]`
on every javascript file in the `src` folder for their respective values.

# API

replaceProps(properties[, options])

## properties (`Plain object`)

The object containing the properties to be searched and replaced.

Bellow we have a list of properties provided by default, that is added to your given properties set.
You still can override any of these.

```javascript
current.date            // string date value
current.time            // string time value
current.datetime        // string datetime value
current.timestamp       // string timestamp value
current.month           // integer month value
current.monthname       // string month name value
current.year            // integer year value
```

## options (`Plain object`)

An argument that configures the replacing proccess options.

The defaults are as follows:
```javascript
{
    enabled: true,
    startDelimiter: "#[[",
    endDelimiter: "]]",
    dateFormat: "dd/mm/yyyy",
    timeFormat: "hh:MM:ss",
    datetimeFormat: "dd/mm/yyyy hh:MM:ss",
    timestampFormat: "yyyy_mm_dd-hh_MM_ss",
    logLevel: LOG_INFO
}
```

### enabled (`Boolean`. Defaults to `true`)

Can be used to enable/disable the replacement proccessing dynamically.

### startDelimiter and endDelimiter (`String`. Defaults to `"#[["` and `"]]"`, respectivelly)

These are the delimiters of a propertie that must be proccessed by the `gulp-replacer` in your sourcecodes.

If you give a properties value of:
```javascript
{
    prop1: "Test prop",
    prop2: "Another test prop",
};
```
and leave the default delimiters, the plugin will search and replace each and all occurences of `#[[prop1]]`
and `#[[prop2]]` in your provided sources with their respective values.

You can even create properties that references other properties!
```javascript
{
    prop1: "Hello #[[prop2]]",
    prop2: "World!",
};
```

If a given prop usage in your source doesn't have a respective key/value in your properties, the usage will be unnafected.

### dateFormat (`String`. Defaults to `"dd/mm/yyyy"`)

Pattern used to format the provided property `current.date`.

See the [dateformat module](https://www.npmjs.com/package/dateformat) for instructions about the valid patterns.

### timeFormat (`String`. Defaults to `"hh:MM:ss"`)

Pattern used to format the provided property `CURRENT_TIME`.

See the [dateformat module](https://www.npmjs.com/package/dateformat) for instructions about the valid patterns.

### datetimeFormat (`String`. Defaults to `"dd/mm/yyyy hh:MM:ss"`)

Pattern used to format the provided property `current.datetime`.

See the [dateformat module](https://www.npmjs.com/package/dateformat) for instructions about the valid patterns.

### timestampFormat (`String`. Defaults to `"yyyy_mm_dd-hh_MM_ss"`)

Pattern used to format the provided property `current.timestamp`.

See the [dateformat module](https://www.npmjs.com/package/dateformat) for instructions about the valid patterns.

### logLevel (`Integer`. Defaults to `2`)

Controls how much logging verbose you want to see on the console.

The possible values are:
```javascript
10  // LOG_ALL
 8  // LOG_DEBUG;
 3  // LOG_INFO;
 2  // LOG_WARNING
 1  // LOG_SEVERE
 0  // LOG_NONE
