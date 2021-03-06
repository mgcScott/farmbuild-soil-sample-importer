describe('farmbuild.soilSampleImporter module: paddockSoilSampleRetriever', function () {




  //access test data under data dir
  beforeEach(function () {
    fixture.setBase('src/unit-test-data')
  });


  //define soil sample result converter
  var $log, paddockSoilSampleRetriever,
    fileFarmDataWithSoilSamples = 'farmdata-susan-with-sample.json';

  // inject farmbuild.soilSampleImporter module
  beforeEach(module('farmbuild.soilSampleImporter', function($provide) {
    $provide.value('$log', console)
  }));

  // inject soilSampleImporter service
  beforeEach(inject(function (_$log_, _paddockSoilSampleRetriever_) {
    $log = _$log_,
      paddockSoilSampleRetriever = _paddockSoilSampleRetriever_;
  }));

  describe('paddockSoilSampleRetriever factory', function () {

    it('paddockSoilSampleRetriever factory should be defined', inject(function () {
      expect(paddockSoilSampleRetriever).toBeDefined();
    }));


    it('paddockSoilSampleRetriever farmdata has soilSamplesInPaddock', inject(function () {
      var loadedFarmData = fixture.load(fileFarmDataWithSoilSamples);
      expect(loadedFarmData).toBeDefined();
      var paddockSoilSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(loadedFarmData,"P1");
      expect(paddockSoilSamples).toBeDefined();
      //$log.info('paddockSoilSamples qqq'+JSON.stringify(paddockSoilSamples,null,"  "));
      expect(paddockSoilSamples.length).toBeGreaterThan(0);
      $log.info(paddockSoilSamples[0]);

      var soils= loadedFarmData.soils;
      var sampleResults=soils.sampleResults;
      var importFields =sampleResults.importFieldNames;


      var averages = paddockSoilSampleRetriever.averagesForSoilSamples(importFields,paddockSoilSamples);


      for(var j=0;j<importFields.length;j++){

        var fieldValue = averages[importFields[j]];
        $log.info('fieldValue[j] '+fieldValue +" [importFieldNames[j] "+importFields[j]);
      }

      var pbiAverage = averages['PBI'];
      $log.info('pbiAverage '+pbiAverage);
      expect((pbiAverage==12)).toBeTruthy();

    }));


    it('paddockSoilSampleRetriever farmdata has soilSamplesInPaddock', inject(function () {
      var loadedFarmData = fixture.load(fileFarmDataWithSoilSamples);
      expect(loadedFarmData).toBeDefined();
      var averagesForPaddockName = paddockSoilSampleRetriever.averagesForPaddock(loadedFarmData,"P3");
      expect(averagesForPaddockName).toBeDefined();

    }));




    it('paddockSoilSampleRetriever ', inject(function () {
      var loadedFarmData = fixture.load(fileFarmDataWithSoilSamples);
      expect(loadedFarmData).toBeDefined();
      var paddockSoilSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(loadedFarmData,"P4");
      $log.info('paddockSoilSamples for p4 '+paddockSoilSamples);
      expect(paddockSoilSamples).toBeUndefined();
    }));

  });


});
