"use strict";

angular.module("farmbuild.soilSampleImporter", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("soilSampleImporter", function(soilSampleImporterSession, soilSampleConverter, importField, soilSampleValidator, soilClassification, paddockSoilSampleRetriever, mangementZones, farmdata, validations, googleAnalyticsImporter, $log) {
    var soilSampleImporter = {
        farmdata: farmdata
    }, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    soilSampleImporter.version = "0.1.0";
    soilSampleImporter.ga = googleAnalyticsImporter;
    soilSampleImporter.session = soilSampleImporterSession;
    $log.info("Welcome to Soil Sample Importer... " + "this should only be initialised once! why we see twice in the example?");
    soilSampleImporter.find = function() {
        return soilSampleImporterSession.find();
    };
    soilSampleImporter.load = function(inputFarmData) {
        var loaded = farmdata.load(inputFarmData);
        $log.info("loaded " + JSON.stringify(loaded, null, "  "));
        if (!_isDefined(loaded)) {
            return undefined;
        }
        if (!loaded.hasOwnProperty("soils")) {
            loaded.soils = {};
        }
        if (!loaded.soils.hasOwnProperty("sampleResults")) {
            loaded.soils.sampleResults = soilSampleImporter.createDefault();
            loaded = farmdata.update(loaded);
        }
        return loaded;
    };
    soilSampleImporter.export = soilSampleImporterSession.export;
    soilSampleImporter.toFarmData = soilSampleConverter.toFarmData;
    soilSampleImporter.createDefault = soilSampleConverter.createDefault;
    soilSampleImporter.isValidFarmDataWithSoilSample = soilSampleValidator.isValidFarmDataWithSoilSample;
    soilSampleImporter.classifyResult = soilClassification.classifyResult;
    soilSampleImporter.hasAverage = importField.hasAverage;
    soilSampleImporter.hasClassification = importField.hasClassification;
    soilSampleImporter.getManagementZoneFields = importField.getManagementZoneFields;
    soilSampleImporter.averageForPaddocks = paddockSoilSampleRetriever.averagesForPaddock;
    soilSampleImporter.averageForManagementZone = mangementZones.averageForManagementZone;
    if (typeof window.farmbuild === "undefined") {
        window.farmbuild = {
            soilSampleImporter: soilSampleImporter
        };
    } else {
        window.farmbuild.soilSampleImporter = soilSampleImporter;
    }
    return soilSampleImporter;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleConverter", function($log, farmdata, validations, soilSampleValidator, soilSampleImporterSession) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, soilSampleConverter = {};
    function createDefault() {
        return {
            dateLastUpdated: new Date(),
            results: {
                columnHeaders: [],
                rows: []
            },
            importFieldDictionary: {},
            paddockRowDictionary: {},
            paddockNameColumn: undefined
        };
    }
    soilSampleConverter.createDefault = createDefault;
    function toFarmData(farmData, newSampleResults) {
        if (!_isDefined(farmData)) {
            return undefined;
        }
        if (!_isDefined(newSampleResults)) {
            return undefined;
        }
        if (!soilSampleValidator.isValidSoilSampleResult(newSampleResults)) {
            return undefined;
        }
        var currentSoils = {};
        if (_isDefined(farmData.soils)) {
            currentSoils = farmData.soils;
        }
        var currentPaddocks = farmData.paddocks;
        if (!_isDefined(currentPaddocks)) {
            return undefined;
        }
        $log.info("before loop");
        var farmDataSampleResults = {};
        var newResults = newSampleResults.results;
        var newImportFieldDictionary = newSampleResults.importFieldDictionary;
        var importFieldNames = [];
        importFieldNames = Object.keys(newImportFieldDictionary);
        $log.info("importFields  " + importFieldNames.length);
        farmDataSampleResults.dateLastUpdated = newSampleResults.dateLastUpdated;
        farmDataSampleResults.importFieldNames = importFieldNames;
        currentSoils.sampleResults = farmDataSampleResults;
        var rows = newResults.rows;
        var paddockRowDictionary = newSampleResults.paddockRowDictionary;
        for (var i = 0; i < currentPaddocks.length; i++) {
            var singlePaddock = currentPaddocks[i];
            var paddockRows = paddockRowDictionary[singlePaddock.name];
            if (!_isDefined(paddockRows) || !_isArray(paddockRows)) {
                continue;
            }
            var singlePaddockSoils = [];
            $log.info("singlePaddockSoils " + paddockRows);
            if (paddockRows.length == 0) {
                continue;
            }
            for (var k = 0; k < paddockRows.length; k++) {
                var rowValues = rows[paddockRows[k]];
                var sampleValue = {};
                for (var j = 0; j < importFieldNames.length; j++) {
                    var temp = {};
                    var indexOfValue = newImportFieldDictionary[importFieldNames[j]];
                    $log.info("indexOfValue " + indexOfValue);
                    $log.info("importFieldNames[j] " + importFieldNames[j]);
                    sampleValue[importFieldNames[j]] = rowValues[indexOfValue];
                }
                singlePaddockSoils.push(sampleValue);
            }
            var singlePaddockSoil = {};
            if (_isDefined(singlePaddock.soils)) {
                singlePaddockSoil = singlePaddock.soils;
            }
            singlePaddockSoil.sampleResults = singlePaddockSoils;
            singlePaddock.soils = singlePaddockSoil;
            currentPaddocks[i] = singlePaddock;
        }
        farmData.soils = currentSoils;
        $log.info(" farmData.soils ", JSON.stringify(farmData.soils, null, "   "));
        farmData.paddocks = currentPaddocks;
        return farmData;
    }
    soilSampleConverter.toFarmData = toFarmData;
    return soilSampleConverter;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleValidator", function($log, farmdata, validations) {
    var soilSampleValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray;
    soilSampleValidator.isValidFarmDataWithSoilSample = function(farmData) {
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return false;
        }
        var soilSampleResults = soils.sampleResults;
        if (!_isDefined(soilSampleResults)) {
            return false;
        }
        var dateLastUpdated = soilSampleResults.dateLastUpdated;
        if (!_isDefined(dateLastUpdated)) {
            return false;
        }
        var importFieldNames = soilSampleResults.importFieldNames;
        if (!_isDefined(importFieldNames)) {
            return false;
        }
        if (!_isDefined(farmData.paddocks)) {
            return false;
        }
        var paddocks = farmData.paddocks[0];
        if (!_isDefined(paddocks.soils)) {
            return false;
        }
        return true;
    };
    soilSampleValidator.isValidSoilSampleResult = function(soilSampleResult) {
        var results = soilSampleResult.results;
        if (!_isDefined(results)) {
            return false;
        }
        var columnHeaders = results.columnHeaders;
        if (!_isDefined(columnHeaders)) {
            return false;
        }
        var rowsData = results.rows;
        if (!_isDefined(rowsData)) {
            return false;
        }
        if (!_isDefined(soilSampleResult.importFieldDictionary)) {
            return false;
        }
        if (!_isDefined(soilSampleResult.paddockRowDictionary)) {
            return false;
        }
        var numberOfPaddocks = Object.keys(soilSampleResult.paddockRowDictionary).length;
        $log.info("numberOfPaddocks " + numberOfPaddocks);
        if (!(numberOfPaddocks > 0)) {
            return false;
        }
        var totalCSVColumns = columnHeaders.length;
        $log.info("Columns in the column headers key " + totalCSVColumns);
        for (var i = 0; i < rowsData.length; i++) {
            var singleRow = rowsData[i];
            if (singleRow.length != totalCSVColumns) {
                $log.error("The " + i + " row with paddick name " + singleRow[0] + " doesn't have required number of columns");
                return false;
            }
        }
        return true;
    };
    return soilSampleValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("googleAnalyticsImporter", function($log, validations, googleAnalytics) {
    var googleAnalyticsImporter = {}, api = "farmbuild-dairy-nutrient-calculator", _isDefined = validations.isDefined;
    googleAnalyticsImporter.track = function(clientName) {
        $log.info("googleAnalyticsImporter.track clientName: %s", clientName);
        googleAnalytics.track(api, clientName);
    };
    return googleAnalyticsImporter;
});

angular.module("farmbuild.soilSampleImporter").constant("importFieldDefaults", {
    types: [ {
        name: "Sample Id",
        soilClassificationName: undefined,
        hasAverage: false
    }, {
        name: "Sample Name",
        soilClassificationName: undefined,
        hasAverage: false
    }, {
        name: "pH H2O (Water)",
        soilClassificationName: "pH H2O (Water)",
        hasAverage: true
    }, {
        name: "Olsen Phosphorus (mg/kg)",
        soilClassificationName: "Olsen Phosphorus (mg/kg)",
        hasAverage: true
    }, {
        name: "PBI",
        soilClassificationName: "PBI",
        hasAverage: true
    }, {
        name: "KCl 40 Sulphur (mg/kg)",
        soilClassificationName: "KCl 40 Sulphur (mg/kg)",
        hasAverage: true
    }, {
        name: "Colwell Phosphorus (mg/kg)",
        soilClassificationName: "Colwell Phosphorus (mg/kg)",
        hasAverage: true
    }, {
        name: "Colwell Potassium (mg/kg)",
        soilClassificationName: "Colwell Potassium (mg/kg)",
        hasAverage: true
    } ]
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importField", function($log, importFieldTypes, validations) {
    $log.info("importField ");
    var importField = {};
    importField.hasClassification = function(importFieldName) {
        var fieldType = importFieldTypes.byName(importFieldName);
        if (fieldType && fieldType.soilClassificationName) {
            return true;
        }
        return false;
    };
    importField.hasAverage = function(importFieldName) {
        var fieldType = importFieldTypes.byName(importFieldName);
        if (fieldType && fieldType.hasAverage) {
            return true;
        }
        return false;
    };
    importField.getManagementZoneFields = function() {
        var result = [];
        var allImportFields = importFieldTypes.toArray();
        for (var i = 0; i < allImportFields.length; i++) {
            if (allImportFields[i].hasAverage) {
                result.push(allImportFields[i]);
            }
        }
        return result;
    };
    return importField;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldTypes", function(collections, validations, importFieldDefaults, $log) {
    var importFieldTypes, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isDefined = validations.isDefined, _types = angular.copy(importFieldDefaults.types);
    function _create(name) {
        var type = {
            name: name
        };
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !_isEmpty(type.name);
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name) {
        var type = _create(name);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    importFieldTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return importFieldTypes;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldSelector", function($log, farmdata, soilSampleImporter, importFieldTypes, collections, importFieldSelectionValidator) {
    $log.info("importFieldSelector ");
    var importFieldSelector = {}, _paddocks = [], _types = importFieldTypes.toArray();
    function _findPaddockWithName(paddocks, name) {
        for (var i = 0; i < paddocks.length; i++) {
            if (name.trim().toUpperCase() == paddocks[i].name.toUpperCase()) {
                return paddocks[i];
            }
        }
        return undefined;
    }
    importFieldSelector.createNew = function(myFarmData, columnHeaders, rows, paddockColumnIndex) {
        if (!importFieldSelectionValidator.validateCreateNew(columnHeaders, rows)) {
            return undefined;
        }
        if (paddockColumnIndex < 0 || paddockColumnIndex >= columnHeaders.length) {
            return undefined;
        }
        collections.add(columnHeaders, "Farm Paddock Name", paddockColumnIndex);
        for (var i = 0; i < rows.length; i++) {
            collections.add(rows[i], "", paddockColumnIndex);
        }
        _paddocks = myFarmData.paddocks;
        importFieldSelector.paddocks = _paddocks;
        var result = {
            dateLastUpdated: new Date(),
            results: {
                columnHeaders: columnHeaders,
                rows: rows
            },
            importFieldDictionary: {},
            paddockRowDictionary: {},
            paddockNameColumn: paddockColumnIndex
        };
        return result;
    };
    importFieldSelector.validate = importFieldSelectionValidator.validateImportFieldsDefinition;
    importFieldSelector.save = function(myFarmData, importFieldsDefinition) {
        $log.info(JSON.stringify(importFieldsDefinition));
        if (!importFieldSelectionValidator.validateImportFieldsDefinition(importFieldsDefinition)) {
            return undefined;
        }
        for (var key in importFieldsDefinition.paddockRowDictionary) {
            for (var i = 0; i < importFieldsDefinition.paddockRowDictionary[key].length; i++) {
                var rowIndex = importFieldsDefinition.paddockRowDictionary[key][i];
                importFieldsDefinition.results.rows[rowIndex][importFieldsDefinition.paddockNameColumn] = key;
            }
        }
        $log.info(JSON.stringify(importFieldsDefinition));
        return soilSampleImporter.toFarmData(myFarmData, importFieldsDefinition);
    };
    importFieldSelector.autoLinkPaddock = function(importFieldsDefinition, linkColumnIndex) {
        var linkedCount = 0;
        if (linkColumnIndex == importFieldsDefinition.paddockNameColumn) {
            return;
        }
        var mappedPaddock = Object.keys(importFieldsDefinition.paddockRowDictionary);
        var mappedRowIndex = [];
        for (var i = 0; i < mappedPaddock.length; i++) {
            mappedRowIndex = mappedRowIndex.concat(importFieldsDefinition.paddockRowDictionary[mappedPaddock[i]]);
        }
        for (var i = 0; i < importFieldsDefinition.results.rows.length; i++) {
            if (mappedRowIndex.indexOf(i) < 0) {
                var paddock = _findPaddockWithName(_paddocks, importFieldsDefinition.results.rows[i][linkColumnIndex]);
                if (paddock) {
                    this.connectRow(importFieldsDefinition, paddock, i);
                    linkedCount++;
                }
            }
        }
        return linkedCount;
    };
    importFieldSelector.connectRow = function(paddockSelection, paddock, rowIndex) {
        if (!paddockSelection.paddockRowDictionary.hasOwnProperty(paddock.name)) {
            paddockSelection.paddockRowDictionary[paddock.name] = [];
        }
        collections.add(paddockSelection.paddockRowDictionary[paddock.name], rowIndex);
    };
    importFieldSelector.disconnectRow = function(paddockSelection, paddock, index) {
        if (paddockSelection.paddockRowDictionary.hasOwnProperty(paddock.name)) {
            collections.remove(paddockSelection.paddockRowDictionary[paddock.name], index);
        }
    };
    importFieldSelector.resetPaddockRowDictionary = function(paddockSelection) {
        paddockSelection.paddockRowDictionary = {};
        return paddockSelection;
    };
    importFieldSelector.classifyColumn = function(paddockSelection, classificationType, index) {
        paddockSelection.importFieldDictionary[classificationType.name] = index;
        $log.info("paddockSelection " + JSON.stringify(paddockSelection));
    };
    importFieldSelector.declassifyColumn = function(paddockSelection, classificationType, index) {
        delete paddockSelection.importFieldDictionary[classificationType.name];
    };
    importFieldSelector.types = _types;
    importFieldSelector.paddocks = _paddocks;
    return importFieldSelector;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldSelectionValidator", function($log, validations, importFieldTypes) {
    var importFieldSelectionValidator = {};
    function _isEmptyObject(obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    }
    importFieldSelectionValidator.validateCreateNew = function(columnHeaders, rows) {
        if (!validations.isDefined(columnHeaders) || columnHeaders.length == 0) {
            $log.error("Soil import column headers must be a valid array");
            return false;
        }
        if (!validations.isDefined(rows) || rows.length == 0) {
            $log.error("Soil import data row must be a valid array");
            return false;
        }
        for (var i = 0; i < rows.length; i++) {
            var aRow = rows[i];
            if (aRow.length != columnHeaders.length) {
                return false;
            }
        }
        return true;
    };
    importFieldSelectionValidator.validateImportFieldsDefinition = function(importFieldsDefinition) {
        if (validations.isEmpty(importFieldsDefinition.paddockRowDictionary) || _isEmptyObject(importFieldsDefinition.paddockRowDictionary)) {
            return false;
        }
        $log.info("importFieldTypes ", JSON.stringify(importFieldTypes.toArray()));
        if (importFieldTypes.toArray().length != Object.keys(importFieldsDefinition.importFieldDictionary).length) {
            return false;
        }
        return true;
    };
    return importFieldSelectionValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("mangementZones", function($log, farmdata, validations, mangementZoneValidator, paddockSoilSampleRetriever) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, mangementZones = {};
    var paddocksInManagementZone = function(farmData, managementZoneName) {
        var paddockList = [];
        if (!mangementZoneValidator.farmDataHasManagementZones(farmData)) {
            return undefined;
        }
        var managementZones = farmData.managementZones;
        for (var i = 0; i < managementZones.length; i++) {
            var singleZone = managementZones[i];
            if (singleZone.name == managementZoneName) {
                paddockList = singleZone.paddocks;
                break;
            }
        }
        $log.info("paddockList " + paddockList);
        return paddockList;
    };
    mangementZones.paddocksInManagementZone = paddocksInManagementZone;
    var averageForManagementZone = function(farmData, managementZoneName) {
        $log.info("averageForManagementZone");
        var zonePaddocks = mangementZones.paddocksInManagementZone(farmData, managementZoneName);
        if (!_isDefined(zonePaddocks) || !(zonePaddocks.length > 0)) {
            return undefined;
        }
        $log.info(" zonePaddocks " + zonePaddocks);
        var allPaddockSoils = [];
        for (var i = 0; i < zonePaddocks.length; i++) {
            var soilsSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(farmData, zonePaddocks[i]);
            if (!_isDefined(soilsSamples)) {
                continue;
            }
            $log.info("soils samples for " + zonePaddocks[i] + " is below \n" + soilsSamples);
            allPaddockSoils = allPaddockSoils.concat(soilsSamples);
            $log.info("paddocks in zony " + allPaddockSoils);
        }
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return undefined;
        }
        var sampleResults = soils.sampleResults;
        if (!_isDefined(sampleResults)) {
            return undefined;
        }
        var importFields = sampleResults.importFieldNames;
        if (!_isDefined(importFields)) {
            return undefined;
        }
        var averageZone = paddockSoilSampleRetriever.averagesForSoilSamples(importFields, allPaddockSoils);
        $log.info("allPaddockSoils " + +JSON.stringify(averageZone, null, "  "));
        return averageZone;
    };
    mangementZones.averageForManagementZone = averageForManagementZone;
    return mangementZones;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("mangementZoneValidator", function($log, farmdata, validations) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, mangementZoneValidator = {};
    mangementZoneValidator.farmDataHasManagementZones = function(farmData) {
        if (!_isDefined(farmData)) {
            return false;
        }
        if (!_isDefined(farmData.managementZones)) {
            return false;
        }
        var managementZones = farmData.managementZones;
        $log.info("managementZones length " + managementZones.length);
        if (!(managementZones.length > 0)) {
            return false;
        }
        return true;
    };
    return mangementZoneValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("paddockSoilSampleRetriever", function($log, validations, importField) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, paddockSoilSampleRetriever = {};
    paddockSoilSampleRetriever.soilSamplesInPaddock = function(farmData, paddockName) {
        $log.info("paddockSoilSampleRetriever.soilSamplesInPaddock");
        if (!_isDefined(farmData)) {
            return undefined;
        }
        var paddock = farmData.paddocks;
        $log.info("soilSamplesInPaddock main  " + paddock.length + " zzzzzz paddock " + JSON.stringify(paddock, null, "  "));
        var singlePaddock, paddockSoil;
        for (var i = 0; i < paddock.length; i++) {
            singlePaddock = paddock[i];
            $log.info("singlePaddock name " + singlePaddock.name);
            if (singlePaddock.name == paddockName) {
                break;
            }
        }
        paddockSoil = singlePaddock.soils;
        $log.info("paddockSoil " + paddockSoil);
        if (!_isDefined(paddockSoil) || !_isDefined(paddockSoil.sampleResults)) {
            return undefined;
        }
        return paddockSoil.sampleResults;
    };
    paddockSoilSampleRetriever.averagesForSoilSamples = function(importFieldNames, soilSamples) {
        if (!_isDefined(importFieldNames) || !(importFieldNames.length > 0)) {
            return undefined;
        }
        if (!_isDefined(soilSamples) || !(soilSamples.length > 0)) {
            return undefined;
        }
        var columnValues = {};
        for (var i = 0; i < soilSamples.length; i++) {
            var singelSoilSample = soilSamples[i];
            for (var j = 0; j < importFieldNames.length; j++) {
                var fieldValue = singelSoilSample[importFieldNames[j]];
                if (_isEmpty(fieldValue) || isNaN(fieldValue)) {
                    continue;
                }
                var singleColumn = columnValues[importFieldNames[j]];
                if (!_isDefined(singleColumn)) {
                    singleColumn = {
                        sum: 0,
                        count: 0
                    };
                }
                if (!importField.hasAverage(importFieldNames[j])) {
                    singleColumn = null;
                } else {
                    singleColumn.sum = singleColumn.sum + fieldValue;
                    singleColumn.count = singleColumn.count + 1;
                }
                columnValues[importFieldNames[j]] = singleColumn;
            }
        }
        var averageValues = {};
        for (var j = 0; j < importFieldNames.length; j++) {
            var singleColumn = columnValues[importFieldNames[j]];
            if (!_isDefined(singleColumn)) {
                continue;
            }
            if (singleColumn == null) {
                averageValues[importFieldNames[j]] = null;
            } else {
                averageValues[importFieldNames[j]] = singleColumn.sum / singleColumn.count;
            }
        }
        $log.info("averageValues " + JSON.stringify(averageValues, null, "  "));
        return averageValues;
    };
    paddockSoilSampleRetriever.averagesForPaddock = function(farmData, paddockName) {
        $log.info("averagesForPaddock");
        var soilSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(farmData, paddockName);
        $log.info("soilSamples " + soilSamples);
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return undefined;
        }
        var sampleResults = soils.sampleResults;
        if (!_isDefined(sampleResults)) {
            return undefined;
        }
        var importFields = sampleResults.importFieldNames;
        if (!_isDefined(importFields)) {
            return undefined;
        }
        $log.info("b4 ret");
        return paddockSoilSampleRetriever.averagesForSoilSamples(importFields, soilSamples);
    };
    return paddockSoilSampleRetriever;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleImporterSession", function($log, farmdata, validations) {
    var soilSampleImporterSession = {}, _isDefined = validations.isDefined;
    function load() {
        var root = farmdata.session.find();
        if (!_isDefined(root)) {
            return undefined;
        }
        return root.soilSampleImporter;
    }
    soilSampleImporterSession.saveSection = function(section, value) {
        var loaded = load();
        if (!_isDefined(loaded)) {
            $log.error("Unable to find an existing farmData! please create then save.");
            return soilSampleImporterSession;
        }
        loaded[section] = value;
        return save(loaded);
    };
    function save(toSave) {
        var farmData = farmdata.session.find();
        if (!_isDefined(farmData)) {
            $log.error("Unable to find the farmData in the session!");
            return undefined;
        }
        farmData.dateLastUpdated = new Date();
        farmData.soilSampleImporter = toSave;
        farmdata.session.save(farmData);
        return toSave;
    }
    soilSampleImporterSession.save = save;
    soilSampleImporterSession.loadSection = function(section) {
        var loaded = load();
        return loaded ? loaded[section] : null;
    };
    soilSampleImporterSession.isLoadFlagSet = function(location) {
        var load = false;
        if (location.href.split("?").length > 1 && location.href.split("?")[1].indexOf("load") === 0) {
            load = location.href.split("?")[1].split("=")[1] === "true";
        }
        return load;
    };
    soilSampleImporterSession.find = function() {
        return farmdata.session.find();
    };
    soilSampleImporterSession.export = function(document, farmData) {
        return farmdata.session.export(document, save(farmData));
    };
    return soilSampleImporterSession;
});

angular.module("farmbuild.soilSampleImporter").constant("soilClassificationDefaults", {
    types: [ {
        name: "pH H2O (Water)",
        ranges: [ {
            name: [ "Very Acidic", "Acidic", "Slightly Acidic", "Neutral" ],
            min: [ undefined, 5.2, 5.5, 6.1 ],
            max: [ 5.2, 5.5, 6.1, undefined ],
            defaultColor: [ "#fffe03", "#96cf4c", "#96cf4c", "#aba3cc" ]
        } ]
    }, {
        name: "Olsen Phosphorus (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            min: [ undefined, 9, 14, 20, 27 ],
            max: [ 9, 14, 20, 27, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "PBI",
        ranges: [ {
            name: [ "Very Sandy", "Sand, Sandy Loams", "Sandy/Silty Loams", "Sandy/Silty Clay Loams", "Clay Loams", "Clay Loams & Clay", "Volcanic Clay & Peat" ],
            min: [ undefined, 15, 35, 70, 140, 280, 840 ],
            max: [ 15, 35, 70, 140, 280, 840, undefined ],
            defaultColor: [ undefined, undefined, undefined, undefined, undefined, undefined, undefined ]
        } ]
    }, {
        name: "KCl 40 Sulphur (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            min: [ undefined, 4.5, 7.5, 10.5, 14 ],
            max: [ 4.5, 7.5, 10.5, 14, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Colwell Phosphorus (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 15 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 15, 23, 30, 41 ],
            max: [ 15, 23, 30, 41, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 15 ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 17, 26, 34, 47 ],
            max: [ 17, 26, 34, 47, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 19, 30, 39, 53 ],
            max: [ 19, 30, 39, 53, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 140 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 22, 35, 45, 61 ],
            max: [ 22, 35, 45, 61, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 140 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 26, 42, 54, 74 ],
            max: [ 26, 42, 54, 74, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ 840 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 37, 58, 75, 102 ],
            max: [ 37, 58, 75, 102, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 840 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 50, 90, 120, 150 ],
            max: [ 50, 90, 120, 150, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Colwell Potassium (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 70, 120, 170, 230 ],
            max: [ 70, 120, 170, 230, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 80, 130, 190, 250 ],
            max: [ 80, 130, 190, 250, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 90, 130, 190, 260 ],
            max: [ 90, 130, 190, 260, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 100, 150, 220, 280 ],
            max: [ 100, 150, 220, 280, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Exch Potassium (meq/100g)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .18, .31, .44, .6 ],
            max: [ .18, .31, .44, .6, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .2, .33, .49, .64 ],
            max: [ .2, .33, .49, .64, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .23, .33, .53, .66 ],
            max: [ .23, .33, .53, .66, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .26, .39, .56, .72 ],
            max: [ .26, .39, .56, .72, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    } ]
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilClassification", function($log, soilClassificationTypes, validations) {
    $log.info("soilClassification ");
    var soilClassification = {}, _isDefined = validations.isDefined;
    function _isWithinRange(min, max, classificationValue) {
        if (!_isDefined(min) && _isDefined(max)) {
            return classificationValue <= max;
        } else if (_isDefined(min) && _isDefined(max)) {
            return min < classificationValue && classificationValue <= max;
        } else if (_isDefined(min) && !_isDefined(max)) {
            return min < classificationValue;
        }
        return false;
    }
    function _findRangeIndex(minArray, maxArray, classificationValue) {
        for (var i = 0; i < minArray.length; i++) {
            if (_isWithinRange(minArray[i], maxArray[i], classificationValue)) {
                return i;
            }
        }
        return -1;
    }
    function _copyResult(classificationRange, index) {
        if (index >= 0 && index < classificationRange.name.length) {
            var result = {};
            result.name = classificationRange.name[index];
            result.defaultColor = classificationRange.defaultColor[index];
            return result;
        }
        return undefined;
    }
    function _isValidType(anObject) {
        try {
            if (_isDefined(anObject) && _isDefined(anObject.name) && _isDefined(anObject.ranges)) {
                return true;
            }
        } catch (err) {}
        return false;
    }
    soilClassification.findRange = function(classificationType, classificationValue) {
        if (!_isValidType(classificationType)) {
            return undefined;
        }
        for (var i = 0; i < classificationType.ranges.length; i++) {
            var aRange = classificationType.ranges[i];
            var index = _findRangeIndex(aRange.min, aRange.max, classificationValue);
            if (index >= 0) {
                return _copyResult(aRange, index);
            }
        }
        return undefined;
    };
    soilClassification.findRangeWithDependency = function(classificationType, classificationValue, dependencyValue) {
        if (!_isValidType(classificationType)) {
            return undefined;
        }
        for (var i = 0; i < classificationType.ranges.length; i++) {
            var aRange = classificationType.ranges[i];
            if (_findRangeIndex(aRange.dependencyRange.min, aRange.dependencyRange.max, dependencyValue) >= 0) {
                var index = _findRangeIndex(aRange.min, aRange.max, classificationValue);
                if (index >= 0) {
                    return _copyResult(aRange, index);
                }
                return undefined;
            }
        }
        return undefined;
    };
    soilClassification.classifyResult = function(sampleResult, key) {
        var type = soilClassificationTypes.byName(key);
        if (!type) {
            return undefined;
        }
        if (type.dependencyRange) {
            return soilClassification.findRangeWithDependency(type, sampleResult[key], sampleResult[type.dependencyRange.name]);
        } else {
            return soilClassification.findRange(type, sampleResult[key]);
        }
    };
    return soilClassification;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilClassificationTypes", function(collections, validations, soilClassificationDefaults, $log) {
    var soilClassificationTypes, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isDefined = validations.isDefined, _types = angular.copy(soilClassificationDefaults.types);
    function _create(name) {
        var type = {
            name: name
        };
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !_isEmpty(type.name);
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name) {
        var type = _create(name);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    soilClassificationTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return soilClassificationTypes;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").run(function(soilSampleImporter) {});

angular.injector([ "ng", "farmbuild.soilSampleImporter" ]);