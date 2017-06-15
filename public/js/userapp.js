'use strict';

//APP INITIALISES
const appState={
  pairingsList:[],
  showPairingsList:true,
};
//STATE MODS
function initialisePairsPage(state){
  state.showPairingsList=true;
}
//RENDER
function render(state){
    let presentPairingsList='';
    let htmlDisplay='';
    let dailyExpectedRating=''; //This is the expected overall rating of all pairs that day
    if(state.showPairingsList===true){
        state.pairingsList.forEach(element => {
            htmlDisplay += `<div class="show-admin-chart"><div class="user-user-id grid">${element.id}</div><div class="user-name-first grid">${element.first_name}</div><div class="user-name-last grid">${element.last_name}</div><div class="user-cohort-id grid">${element.cohort_id}</div><div class="user-user-location grid">${element.location}</div></div>`
            //htmlDisplay += `<p>Please work!</p>`
            //console.log("This is partner 1: " + element.name1);
            //console.log("This is partner 2: " + element.name2);
            //console.log("This is the partner rating: " + element.rating);
            //dailyExpectedRating=`<div class="over-rating-notice"><p>The overall rating for today is: ${element.expected_rating}</p></div>`
            //console.log("This is the render: " + htmlDisplay);
    }); 
    $('.concept-users-chart').html(htmlDisplay);
        //state.showPairingsList
  }
  else{
    presentPairingsList+='<p>No pairings</p>';
  }
}
//EVENT HANDLERS
function eventHandlers(){
    $('.create-add-user-form').submit(function(event) {
        event.preventDefault();
        const first_name = $("#user-first-name").val();
        const last_name=$("#user-last-name").val();
        const cohort_id=$("#user-cohort-id").val();
        const location=$("#user-location").val();
        const data = {first_name, last_name, cohort_id, location};
        console.log(data);
        // $.ajax({
        //     type: 'POST',
        //     $("#yada-yada").val()
        //     const first_name = $("#user-first-name").val()
        // })
        $.ajax({
            url: '/cohort_members',
            dataType: 'json',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(json){
                //console.log(json);
            },
        });
    });
    $('.create-update-user-form').submit(function(event) {
        event.preventDefault();
        const id = $("#student-user-id").val();
        const location=$("#student-user-location").val();
        const data = {id, location};
        console.log(data);
        $.ajax({
            url: `/cohort_members/${id}`,
            dataType: 'json',
            type: 'put',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(json){
                console.log(json);
            },
        });
    });
    render(appState);
}
//localhost:8080/cohort_members
function getContents(){
  $.ajax({
    url: '/cohort_members/active',
    type: 'GET',
    dataType: 'json',
    success: function(json){
      //console.log("These are the pairings: " + json);
      //console.log(json);
      appState.pairingsList=json;
      render(appState);
    },
        // success: function(result){
        //     $('.student-pairings-chart').html(result);
  });
}
// let testShowing;
// $.get('/todays_pairs', function(result){
//     testShowing=result;
// })
// $.getJSON('/server.js', function(){
    
// })
// $(.student-pairings-chart).load('/');
// console.log(response);

//RUN THIS CUTENESS
$(function(){
  eventHandlers();
  getContents();
  render(appState,'');
});