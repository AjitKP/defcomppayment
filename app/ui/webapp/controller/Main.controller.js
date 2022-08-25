// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("defcomp.payment.ui.controller.Main", {
            onAfterRendering: function(){
                if(this.getView().byId("idEmployeeInput").getValue().length > 5){
                    this.onDisplay()
                }
            }, 
            onInit: function () {
                this.oDialog = this.getView().byId("selectDialog");
                this.GADetailsDialog = this.getView().byId("GADetailsDialog");
                this.VADetailsDialog = this.getView().byId("VADetailsDialog");
                this._getEmpList();
                this._getURLEmp();
                this.aLTIData = [];
                this.aLTIAllocatedData = [
                    {
                        "assignedYear": "2021",
                        "assignedAmount": "600000",
                        "allocations": [    {"name": "LTI2021", "year": "2021", "amount": "200000"},
                                            {"name": "LTI2022", "year": "2022", "amount": "200000"},
                                            {"name": "LTI2023", "year": "2023", "amount": "200000"}     ]
                    },
                    {
                        "assignedYear": "2022",
                        "assignedAmount": "900000",
                        "allocations": [    {"name": "LTI2022", "year": "2022", "amount": "300000"},
                                            {"name": "LTI2023", "year": "2023", "amount": "300000"},
                                            {"name": "LTI2024", "year": "2024", "amount": "300000"}     ]
                    },
                    {
                        "assignedYear": "2023",
                        "assignedAmount": "1200000",
                        "allocations": [    {"name": "LTI2023", "year": "2023", "amount": "400000"},
                                            {"name": "LTI2024", "year": "2024", "amount": "400000"},
                                            {"name": "LTI2025", "year": "2025", "amount": "400000"}     ]
                    }
                ];
                this.aRatingPercent = [     {"perfrating":3, "paypercent":50},
                                            {"perfrating":4, "paypercent":75},
                                            {"perfrating":5, "paypercent":100}       ]
                this.aEmpYearRating = [     {"year":"2022", "rating":3}, 
                                            {"year":"2023", "rating":5}         ];
                this.payGrade = "";
            },
            _getEmpInfo: function(sUserId){
                var that = this;
                $.ajax({
                    url: `/defcomppaymentui/odata/v2/EmpJob?$format=json&$filter=userId eq '${sUserId}'`,
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false,
                    error: function (error, jQXHR) {
                        console.log(error);
                    },
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        that.payGrade = odata.d.results[0].payGrade;
                    }
                })

                $.ajax({
                    url: `/defcomppaymentui/vesting/v2/DCVService/Odata/VestingDetails?$filter=rolecode eq '${that.payGrade}'`,
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false,
                    error: function (error, jQXHR) {
                        console.log(error);
                    },
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        that.aRatingPercent = odata.d.results;
                    }
                })                
            },
            _getRatingByYear : function(sYear){
                var iRating = 0;
                for(let i=0; i<this.aEmpYearRating.length; i++){
                    if(parseInt(sYear)==parseInt(this.aEmpYearRating[i].year)){
                        iRating = this.aEmpYearRating[i].rating;
                        break;
                    }
                }
                return iRating;
            },    
            _getPayPercentByRating : function(sRating){
                var iPayPercent = 0;
                for(let i=0; i<this.aRatingPercent.length; i++){
                    if(parseInt(sRating)==parseInt(this.aRatingPercent[i].perfrating)){
                        iPayPercent = this.aRatingPercent[i].paypercent;
                        break;
                    }
                }
                return iPayPercent;
            },  
            _addYearsToDate : function(sDate, iCnt){
                if(sDate.length<10){
                    return 'NA';
                }else{
                    return sDate.substring(0,6)+(parseInt(sDate.slice(-4))+iCnt) 
                }
             },                
            _getEmpList: function () {
                var that = this;
                $.ajax({
                    url: "/defcomppaymentui/odata/v2//PerPersonal?$format=json&$top=100&$select=personIdExternal,firstName,lastName&$filter=startswith(personIdExternal, '8029') eq true",
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false,
                    error: function (error, jQXHR) {
                        console.log(error);
                    },
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        var oModel = new JSONModel({ "Employees": odata.d.results });
                        that.getView().setModel(oModel, "sfEmp");
                    }
                })
            },
            _getURLEmp: function(){
                var that = this;
                var sId = jQuery.sap.getUriParameters().get("id")
                if(sId == null){return};
                $.ajax({
                    url: `/defcomppaymentui/odata/v2/PerPersonal?$filter=personIdExternal eq '${sId}'&$format=json`,
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false,
                    error: function (error, jQXHR) {
                        console.log(error);
                    },
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        var oEmpInfo = odata.d.results[0];
                        that.getView().byId("idEmployeeInput").setValue(`${oEmpInfo.personIdExternal} : ${oEmpInfo.firstName} ${oEmpInfo.lastName}`)
                    }
                })
            },
            _getFilterCriteria: function (sInputValue) {
                if(sInputValue != ""){
                    return [new Filter({    filters: [  new Filter("personIdExternal", FilterOperator.Contains, sInputValue),
                                                        new Filter("firstName", FilterOperator.Contains, sInputValue),
                                                        new Filter("lastName", FilterOperator.Contains, sInputValue)            ],
                                            and: false,                                                                         })]
                }else{
                    return [];
                }
            },
            _convertJSONDateToString : function (sInput) {
                let aDateParts = sInput.split('(')[1].split(')')[0].split('+');
                let dOutput = new Date(parseInt(aDateParts[0]));
                let sDate = ('0'+dOutput.getDate()+'.').slice(-3) + ('0'+(dOutput.getMonth()+1)+'.').slice(-3) + ('0'+dOutput.getFullYear()).slice(-4);
                return sDate
            },
            onDisplay: function(){
                var that = this;
                var sEmpId = this.getView().byId("idEmployeeInput").getValue().split(":")[0].trim();
                if(!sEmpId) return;
                this._getEmpInfo(sEmpId);
                $.ajax({
                    url: `/defcomppaymentui/odata/v2/User('${sEmpId}')/externalCodeOfcust_Demo_compNav?$format=json&$expand=cust_Comp_Worksheet`,
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false,
                    error: function (error, jQXHR) {
                        console.log(error);
                    },
                    success: function (odata, jQXHR, status) { 
                        console.log(odata);
                        console.log(that);                        
                        var aCompResult = odata.d.results[0].cust_Comp_Worksheet.results, aAllocatedData=[], oAllocatedEntry={}, aYears=[], oCalcData={}, aCalculatedData=[], aAssignedYears=[];
                        for(let i=0; i<aCompResult.length; i++){
                            oAllocatedEntry.assignedYear    = parseInt(aCompResult[i].cust_Financial_Year);
                            oAllocatedEntry.assignedAmount  = parseInt(aCompResult[i].cust_Allocated_amount)
                            oAllocatedEntry.grantedDate     = that._convertJSONDateToString(aCompResult[i].cust_Demo_1);
                            oAllocatedEntry.name            = 'LTI Year 1';
                            oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 0;
                            oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y1);
                            aAllocatedData.push({...oAllocatedEntry});
                            oAllocatedEntry.name            = 'LTI Year 2';
                            oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 1;
                            oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y2);  
                            aAllocatedData.push({...oAllocatedEntry});                          
                            oAllocatedEntry.name            = 'LTI Year 3';
                            oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 2;
                            oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y3);  
                            aAllocatedData.push({...oAllocatedEntry});                                                     
                        }
                        var oModel = new JSONModel({ "Allocated": aAllocatedData});
                        that.getView().setModel(oModel, "sfLTI");  
                        for(let i=0; i<aAllocatedData.length; i++){
                            if(aAssignedYears.includes(parseInt(aAllocatedData[i].assignedYear)) == false){
                                aAssignedYears.push(parseInt(aAllocatedData[i].assignedYear));
                            }
                            if(oCalcData[aAllocatedData[i].year] == undefined){
                                oCalcData[aAllocatedData[i].year] = {year: aAllocatedData[i].year, GrantedAmount:0, GADetails:[]}
                            }
                            oCalcData[aAllocatedData[i].year].GrantedDate   = aAllocatedData[i].grantedDate;
                            oCalcData[aAllocatedData[i].year].GrantedAmount = oCalcData[aAllocatedData[i].year].GrantedAmount +  aAllocatedData[i].amount;
                            oCalcData[aAllocatedData[i].year].GADetails.push({...aAllocatedData[i]});
                        }    
                        aYears = Object.keys(oCalcData).map(sYear=>parseInt(sYear));  
                        for(let i=0; i<aYears.length; i++){
                            // sYear = aYears[i].toString();
                            if(oCalcData[(aYears[i]-1).toString()] == undefined){
                                oCalcData[aYears[i]].VestedAmount   = 0;
                                oCalcData[aYears[i]].VestedDate     = 'NA';
                                oCalcData[aYears[i]].VADetails      = {};
                                oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount = 0;
                                oCalcData[aYears[i]].VADetails.Rating = 0;
                                oCalcData[aYears[i]].VADetails.VestingPercent = 0;
                                oCalcData[aYears[i]].PaymentDtae    = 'NA';
                                oCalcData[aYears[i]].PaymentAmount  = 0;
                            }else{
                                oCalcData[aYears[i]].VADetails = {};
                                oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount = oCalcData[(aYears[i]-1).toString()].GrantedAmount;
                                oCalcData[aYears[i]].VADetails.Rating = that._getRatingByYear(aYears[i]);
                                oCalcData[aYears[i]].VADetails.VestingPercent = that._getPayPercentByRating(that._getRatingByYear(aYears[i]));
                                oCalcData[aYears[i]].VestedAmount = oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount * oCalcData[aYears[i]].VADetails.VestingPercent/ 100;
                                oCalcData[aYears[i]].VestedDate = that._addYearsToDate(oCalcData[(aYears[i]-1).toString()].GrantedDate, 1)
                                oCalcData[aYears[i]].PaymentDtae    = that._addYearsToDate(oCalcData[(aYears[i]-1).toString()].VestedDate, 1);
                                oCalcData[aYears[i]].PaymentAmount  = oCalcData[(aYears[i]-1).toString()].VestedAmount;                             
                            }
                        } 
                        aAssignedYears = aAssignedYears.sort();
                        for(let i=0; i<aAssignedYears.length; i++){
                            aCalculatedData.push(JSON.parse(JSON.stringify(oCalcData[aAssignedYears[i]])));
                        }
                        var oClacModel = new JSONModel({ "Calculated": aCalculatedData});
                        that.getView().setModel(oClacModel, "sfLTIC");                                                                      
                    }
                })
                var aAllocatedData=[], oAllocatedEntry={};
                for(let i=0; i<this.aLTIAllocatedData.length; i++){
                    for(let j=0; j<this.aLTIAllocatedData[i].allocations.length; j++){
                        oAllocatedEntry = {...this.aLTIAllocatedData[i]};
                        delete oAllocatedEntry.allocations;
                        oAllocatedEntry = {...oAllocatedEntry, ...this.aLTIAllocatedData[i].allocations[j]};
                        aAllocatedData.push(JSON.parse(JSON.stringify(oAllocatedEntry)));
                    }
                }
                // var oModel = new JSONModel({ "Allocated": aAllocatedData});
                // that.getView().setModel(oModel, "sfLTI");                
            },
            onDisplayGADetails: function(oEvent){
                debugger;
                var aIdList = oEvent.getSource().getId().split('-');
                var iRowId  = parseInt(aIdList[aIdList.length - 1]);
                var aGADetails = JSON.parse(JSON.stringify(this.getView().getModel("sfLTIC").getData().Calculated[iRowId].GADetails));
                var oModel = new JSONModel({ "GADetails": aGADetails});
                this.getView().setModel(oModel, "sfGrant");  
                this.GADetailsDialog.open();
            },
            onDisplayVADetails: function(oEvent){
                debugger;
                var aIdList = oEvent.getSource().getId().split('-');
                var iRowId  = parseInt(aIdList[aIdList.length - 1]);
                var aGADetails = JSON.parse(JSON.stringify(this.getView().getModel("sfLTIC").getData().Calculated[iRowId].VADetails));
                var oModel = new JSONModel({ "VADetails": aGADetails});
                this.getView().setModel(oModel, "sfVest");  
                this.VADetailsDialog.open();
            },            
            onCloseGADetails: function(oEvent){
                this.GADetailsDialog.close();
            },
            onCloseVADetails: function(oEvent){
                this.VADetailsDialog.close();
            },            
            onValueHelpRequest: function (oEvent) {
                this.getView().byId("idEmployeeInput").setValue("");
                this.oDialog.getBinding("items").filter(this._getFilterCriteria(""));
                this.oDialog.open();
            },

            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("Name", FilterOperator.Contains, sValue);
                oEvent.getSource().getBinding("items").filter(this._getFilterCriteria(sValue));
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);
                if (!oSelectedItem) { return; }
                this.byId("idEmployeeInput").setValue(oSelectedItem.getTitle());
            }
        });
    });
