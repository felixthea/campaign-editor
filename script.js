$(document).ready(function() {
	
	function get(resource){
		var apiToken = "?api_token=c3ac5cdb9e79c59ec617345970c9a399880516ef"
		return $.ajax({
			url: 'http://challenge.mediamath.com/api/'+resource+apiToken
		})
	}
	
	function populateAgencySelect() {
		var updateAgencySelect = function(resp) {
			_.each(resp.agencies, function(agency,index){
				var $agencyOption = $('<option></option>')
				$agencyOption.attr("value",agency._id)
				$agencyOption.html(agency.name)
				$('#agency-selector').append($agencyOption)
			})
		}
		
		var error = function(req,status,error){
			console.log(error)
		}
		
		get("agencies").then(updateAgencySelect)
	}
	
	var populateAdvertiserSelect = function(agencyId) {
		$('#advertiser-selector').html("<option value='no-choice'>Choose an advertiser...</option")
		
		var updateAdvertiserSelect = function(resp){
			var agencyAdvertisers = _.where(resp.advertisers, {agency_id: agencyId})
			
			_.each(agencyAdvertisers, function(advertiser,index){
				var $advertiserOption = $('<option></option>')
				$advertiserOption.attr("value",advertiser._id)
				$advertiserOption.html(advertiser.name)
				$('#advertiser-selector').append($advertiserOption)
			})
			enableElement($('#advertiser-selector'))
		}
		
		var error = function(req,status,error){
			console.log(error)
		}
		
		get("advertisers").then(updateAdvertiserSelect, error)
	}
	
	var populateCampaigns = function(advertiserId){		
		var $campaignList = $('.campaign-list')
		
		var renderCampaigns = function (resp) {
			var $campaignHeader = $('.campaign-header').clone({withDataAndEvents: true})
			$('.campaign-list').empty()
			$('.campaign-list').append($campaignHeader)
			
			var advertiserCampaigns = _.where(resp.campaigns, {advertiser_id: advertiserId})
			_.each(advertiserCampaigns,function(campaign){
				$campaignLi = $('<li></li>').addClass('campaign')
				$campaignLi.attr("data-id",campaign._id)
				$campaignLi.html(buildCampaignForm(campaign))
				$campaignList.append($campaignLi)
			})
			
			$('.campaign-header #checkbox input').attr("disabled",false)
		}
		
		var error = function(req,status,error){
			console.log(error)
		}
		
		get("campaigns").then(renderCampaigns,error)
	}
	
	var buildCampaignForm = function(campaign) {
		var $form = $('<form></form>')
		var $checkbox = $('<input type="checkbox" id="to-update"></input>')
		var $name = $('<input type="text" name="campaign-name"></input>')
		var $status = $('<select name="campaign-status"></select>')
		var $budget = $('<input type="number" name="campaign-budget"></input>')
		var $startDate = $('<input type="date" name="campaign-start-date"></input>')
		var $endDate = $('<input type="date" name="campaign-end-date"></input>')
		
		$status.append($('<option value="true">Active</input>'))
		$status.append($('<option value="false">Inactive</input>'))
		
		startDateString = campaign.start_date.substring(0,10)
		endDateString = campaign.end_date.substring(0,10)
		
		$form.attr("data-id", campaign._id)
		$checkbox.prop("checked", false)
		$name.attr("value", campaign.name)
		campaign.status ? $status.attr("value", true) : $status.attr("value", false)
		$budget.attr("value", campaign.budget)
		$startDate.attr("value", startDateString)
		$endDate.attr("value", endDateString)

		$form.append($checkbox, [$name, $status, $budget, $startDate, $endDate])
		
		return $form
	}
	
	var updateCampaigns = function() {
		var $campaigns = $('.campaign-list').find('input:checked').parent()
		_.each($campaigns,function(campaign,index,list){
			var $formData = $(campaign).serialize()
			var campaignId = $(campaign).attr("data-id")
			$.ajax({
				url: 'http://challenge.mediamath.com/api/campaigns/' + campaignId + '/?api_token=c3ac5cdb9e79c59ec617345970c9a399880516ef',
				type: 'post',
				data: $formData,
				success: function(data,status,jqXHR){
					showSuccessMessage();
				},
				error: function(req,status,err){
					showErrorMessage();
				}
			})
		})
	}
	
	var showSuccessMessage = function(){
		$('#success-message').removeClass('hidden');
		$('.black-overlay').css('display', 'block');
	}
	
	var showErrorMessage = function(){
		$('#error-message').removeClass('hidden');
		$('.black-overlay').css('display', 'block');
	}
	
	$('#agency-selector').on('change', function(event){
		var selectedAgencyId = $(event.currentTarget).find(":selected").attr("value")
		selectedAgencyId === "no-choice" ? disableAdvertiserSelector() : populateAdvertiserSelect(selectedAgencyId)
	})
	
	$('#advertiser-selector').on('change', function(event){
		var selectedAdvertiserId = $(event.currentTarget).find(":selected").attr("value")
		selectedAdvertiserId === "no-choice" ? disableElement($('button#get-campaigns')) : enableElement($('button#get-campaigns'))
	})
	
	$('button#get-campaigns').on('click', function(event){
		event.preventDefault();
		var selectedAdvertiserId = $(event.currentTarget).parent().find('#advertiser-selector').find(':selected').attr("value")
		populateCampaigns(selectedAdvertiserId)
	})
	
	$('button#save-campaigns').on('click', function(event){
		event.preventDefault();
		updateCampaigns();
	})
	
	$('.messages').on('click', 'button', function(event){
		$('.black-overlay').css('display', 'none');
		$(event.currentTarget).parent().addClass('hidden')
	})
	
	$('#check-all').on('click', function(event){
		$allCheckBoxes = $('input#to-update')
		if ($(event.currentTarget).prop('checked')) {
			$allCheckBoxes.prop("checked", true)
		} else {
			console.log("unchecking all checkboxes")
			$allCheckBoxes.prop("checked", false)
		}
	})
	
	$('.campaign-list').on('change','#to-update', function(event){
		var numCampaigns = $('input#to-update').length
		var numChecked = $('input#to-update').filter(':checked').length
		
		if (numChecked === numCampaigns){
			setIndeterminate(false)
			setAllChecked(true)
		} else if (numChecked === 0){
			setAllChecked(false)
			setIndeterminate(false)
		} else if (numChecked < numCampaigns){
			setAllChecked(false)
			setIndeterminate(true)
		}
		
		function setIndeterminate(status){
			status ? $('#check-all').prop('indeterminate', true) : $('#check-all').prop('indeterminate', false)
		}
		
		function setAllChecked(status){
			status ? $('#check-all').prop('checked', true) : $('#check-all').prop('checked', false)
		}
	})
	
	var disableAdvertiserSelector = function() {
		disableElement($('#advertiser-selector'))
		$('#advertiser-selector').html("<option value='no-choice'>Choose an advertiser...</option").trigger("change")
	}
	
	var disableElement = function($el){
		$el.attr("disabled", true)
	}
	
	var enableElement = function($el){
		$el.attr("disabled", false)
	}
	
	populateAgencySelect();
})