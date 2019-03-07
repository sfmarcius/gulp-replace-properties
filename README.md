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

### caseSensitive (`Boolean`. Defaults to `true`)

Controls whether the property lookup must be case sensitive or insensitive.

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

### logLevel (`Integer`. Defaults to `3`)

Controls how much logging verbose you want to see on the console.

The possible values are:
```javascript
10  // log all
 8  // log debug and bellow
 6  // log fine and bellow
 4  // log success and bellow
 3  // log info and bellow
 2  // log warning and bellow
 1  // log severe and bellow
 0  // log nothing
```

### resolveProperties (`Boolean`. Defaults to `true`)

Controls whether the given cross-referenced properties must be processed prior the replacement.

If ´false´, the replacement will be done with the properties values as is. 

### failOnMissingProperties (`Boolean`. Defaults to `false`)

Controls whether the replacement proccess must fail or just ignore non-existing referenced properties.

If ´false´, nothing will be done with unknown properties (it will remain as is). If ´true´, an error will be thrown.


### failOnCiclicProperties (`Boolean`. Defaults to `false`)

Before the replacement takes place, the cross-referenced properties will be resolved (if `resolveProperties=true`).

This option instructs what to do if this resolution results in a ciclic recursion.

If ´false´, as soon as the plugin detects a recursive property, it will just abort and skip its resolution (leave it as it originally is).

If ´true´, as soon as the plugin detects a recursive property it throws an error.
