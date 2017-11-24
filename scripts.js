function slider(){
    var slider = document.getElementById("myRange");
    var output = document.getElementById("date");
    // output.innerHTML = slider.value; // Display the default slider value
    //setTimeout(drawChart, 1)

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        try{
            if (this == undefined || this == null) {
                var row = window.officeStates[0];
            } else {
                var row = window.officeStates[this.value];  
            }

            // Update chart with updated date
            updateChart(convertCellDate(row.date));

            // Display date under slider
            var Day = new Date(row.date);
            output.innerHTML = moment(Day).format('MMMM Do YYYY');

            for (var k in row){
                if (k=="notes"){
                    var notes = document.getElementById("notes");
                    notes.innerText = row[k];
                }
                else if (row.hasOwnProperty(k)) {
                    
                    try {
                        var d = document.getElementById(k);
                        /*console.log("Key is " + k + ", value is " + row[k], d);*/
                        d.style.opacity = row[k];
                    } catch(e) {
                        console.log("hmmmm", e);
                    }
                }
            }
        } catch(e) {
            console.log("probably just wait for the spreadsheet to load (floorplan) ", e);
        }
    } 
}



function init() {
    Tabletop.init( { key: window.BVNofficeProgressPublicSpreadsheetUrl,
                        callback: showInfo,
                        simpleSheet: true } )
}

function showInfo(data, tabletop) {
    // alert('Successfully processed the table!')
    console.log(data);
    window.officeStates = data;
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('DOMContentLoaded', slider);
















var nearlyFilledDataRows = [];

google.charts.load('current', {'packages':['gantt']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    try {
        //Finds where the dates are - assumes the first relevant column is the third one.
        for (var tempRow = window.officeStates.length-1; tempRow >= 0; tempRow--) {
            if (window.officeStates[tempRow]["date"] == 'datesStart') {
                var datesStartRow = tempRow;
                break;
            }
            //console.log(window.officeStates[tempRow])
        }

        slider();

        //Creating the data structure for the gantt chart
        data = new google.visualization.DataTable();
        data.addColumn('string', 'Task ID');
        data.addColumn('string', 'Task Name');
        if (window.BVNvisualiserColouredBySector) {
            data.addColumn('string', 'Resource');
        }
        data.addColumn('date', 'Start Date');
        data.addColumn('date', 'End Date');
        data.addColumn('number', 'Duration');
        data.addColumn('number', 'Percent Complete');
        data.addColumn('string', 'Dependencies');

        //Start column of the date data
        //var startColumn = 2;

        //Various variable initialisations for the following loop
        var name = "initial name";
        var previousNameList = [];
        startDay = new Date(2001, 1, 1);
        endDay = new Date(2002, 2, 2);
        var cellValue = null;
        var nameUnfound = true;
        var extraCount = 2;
        rowCount = 0;
        var constructionIdentifier = window.BVNvisualiserConstructionIdentifier;
        var cellValueStart = "3/3/2003";
        var cellValueEnd = "4/4/2004";
        var currentTime = Date.now();
        var percentageCompleted = 100;

        //console.log("HERE! Part -1");
        //console.log(window.officeStates);
        //console.log(Object.keys(window.officeStates).length);
        //console.log(datesStartRow)
        //console.log("HERE! Part 0");

        //Loops through each column and adds relevant rows to gantt chart
        //for (var tempColumn = startColumn; tempColumn < Object.keys(window.officeStates[0]).length; tempColumn++) {
        
        
        for (var columnKey in window.officeStates[datesStartRow]) {
            //Looping through the rows
            //console.log("HERE! Part 1")

            for (var tempRow = datesStartRow; tempRow < window.officeStates.length; tempRow += 2) {
                cellValueStart = window.officeStates[tempRow][columnKey];

                //console.log(tempRow, columnKey)
                //console.log(window.officeStates)
                //console.log(columnKey.substr(0,constructionIdentifier.length) + " = " + constructionIdentifier)
                //console.log(columnKey.substr(0,constructionIdentifier.length) == constructionIdentifier)
                //console.log("HERE! Part 2")

                //Ensuring invalid cells aren't treated as dates
                //console.log(cellValueStart)

                if (cellValueStart == null || cellValueStart == "" || columnKey.substr(0,constructionIdentifier.length) != constructionIdentifier) {
                    break;
                } else {
                    //Checking for name already being taken
                    if (previousNameList.indexOf(columnKey) == -1) { //Workaround for the lack of an 'in' function in javascript
                        name = columnKey;
                        //console.log("HERE! Part 3a");
                    } else {
                        //console.log("HERE! Part 3b");
                        //Adding extra "pt." until untaken
                        extraCount = 2;
                        nameUnfound = true;
                        while (nameUnfound == true) {
                            if (previousNameList.indexOf(columnKey + " pt." + extraCount) == -1) {
                                name = columnKey + " pt." + extraCount;
                                nameUnfound = false;
                            }
                            extraCount++;
                        }
                    }
                    previousNameList.push(name);

                    //Formatting start and end dates
                    cellValueEnd = window.officeStates[tempRow + 1][columnKey]
                    startDay = convertCellDate(cellValueStart)
                    endDay = convertCellDate(cellValueEnd)
                    
                    //Calculating percentage completed from start, current, and end times
                    if (endDay.getTime() < currentTime) {
                        percentageCompleted = 100;
                    } else if (startDay.getTime() > currentTime) {
                        percentageCompleted = 0;
                    } else {
                        percentageCompleted = Math.round(((currentTime-startDay.getTime())/((endDay.getTime()-startDay.getTime())))*100);
                    }
                    //Adding row information
                    if (window.BVNvisualiserColouredBySector) {
                        data.addRow([name, name, columnKey, startDay, endDay, null, 100, null]);

                        //Adding row information to global variable for easy continual generation
                        nearlyFilledDataRows.push([name, name, columnKey, startDay, endDay, null]);
                    } else {
                        data.addRow([name, name, startDay, endDay, null, percentageCompleted, null]);

                        //Adding row information to global variable for easy continual generation
                        nearlyFilledDataRows.push([name, name, columnKey, startDay, endDay, null]);
                    }
                    rowCount++;
                    //console.log(name + " " + startDay + " " + endDay);
                }
            }
        }
        
        //console.log("HERE! Part 4")
        //console.log(Date.now())
        //Test row data:
        /*
        data.addRows([
            ['2014Spring', 'Spring 2014',
             new Date(2014, 2, 22), new Date(2014, 5, 20), null, 100, null],
            ['2014Summer', 'Summer 2014',
             new Date(2014, 5, 29), new Date(2014, 8, 20), null, 100, null],
            ['2014Autumn', 'Autumn 2014',
             new Date(2014, 7, 21), new Date(2014, 11, 20), null, 100, null],
            ['2014Winter', 'Winter 2014',
             new Date(2014, 11, 21), new Date(2015, 2, 11), null, 100, null],
            ['2015Spring', 'Spring 2015',
             new Date(2014, 10, 22), new Date(2015, 2, 20), null, 100, null],
        ]);
        */
        
        rowCount = 20;

        chartOptions = {
            height: 30*rowCount + 50,
            gantt: {
                trackHeight: 30
            },
            labelStyle: {
                fontName: "Arial",
                fontSize: 40,
                color: '#FF0000'
            }
        };

        //console.log("HERE! Part 5")

        var container = document.getElementById('chart_div');
        chart = new google.visualization.Gantt(document.getElementById('chart_div'));

        // monitor activity, change bar color

        /*
        var observer = new MutationObserver(function (mutations) {
            Array.prototype.forEach.call(container.getElementsByTagName('path'), function(bar, index) {
                if (data.getValue(index, 6) > 100) {
                    bar.setAttribute('fill', '#a52714');
                }
            });
        });
        observer.observe(container, {
            childList: true,
            subtree: true
        });
        */


        //console.log("HERE! Part 6")


        //console.log(data, name, previousNameList, startDay, endDay, cellValue, nameUnfound, extraCount, rowCount,
        //            constructionIdentifier, cellValueStart, cellValueEnd, columnKey, tempRow, options, chart)


        //https://developers.google.com/chart/interactive/docs/gallery/ganttchart#a-simple-example

        //https://stackoverflow.com/questions/40655308/change-the-bar-color-in-gantt-chat-based-on-value/40655754#40655754

        chart.draw(data, chartOptions);
    } catch(e) {
        console.log("probably just wait for the spreadsheet to load (gantt chart initialisation) ", e);
        setTimeout(drawChart, 500);
    }
}



function convertCellDate(dateString) {
    //Converts the date from the structure it's given in in the cell to the necessary format for the gantt chart
    dateList = dateString.split('/');
    return new Date(dateList[2], dateList[0], dateList[1]);
}


function updateChart(currentTime) {
    /* Updates chart data with date from slider*/
    try {
        console.log(nearlyFilledDataRows)

        throw '- actually just temp error to stop this function from working.'

        //Removing all the rows
        data.removeRows(0, rowCount-1)

        console.log("GOT HERE!! -1")
        var updatedChartData = [];
        for (var incompleteRow in nearlyFilledDataRows) {
            console.log("GOT HERE!! 0")
            if (endDay.getTime() < currentTime) {
                percentageCompleted = 100;
            } else if (startDay.getTime() > currentTime) {
                percentageCompleted = 0;
            } else {
                percentageCompleted = Math.round(((currentTime-startDay.getTime())/((endDay.getTime()-startDay.getTime())))*100);
            }
            console.log("GOT HERE!! 1")
            data.addRow(incompleteRow.concat([percentageCompleted, null]));
        }
        console.log("GOT HERE!! 2")
        chart.draw(updatedChartData, chartOptions);
    } catch(e) {
        console.log("probably just wait for the spreadsheet to load (gantt chart update) ", e);
    }
}