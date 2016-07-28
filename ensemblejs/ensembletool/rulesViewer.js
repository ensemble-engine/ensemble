define(["ensemble", "util", "rulesEditor", "messages", "jquery"], function(ensemble, util, rulesEditor, messages, $){

	var ruleFilterKey = function(e) {
		var raw = document.getElementById("inputRuleFilter").value;
		filterWithout("tabstrigger", raw);
		filterWithout("tabsvolition", raw);
	}

	var init = function() {
		document.getElementById("inputRuleFilter").onkeyup = ruleFilterKey;
		document.getElementById("inputRuleFilter").onchange = ruleFilterKey;
		$("#newRuleButton").click(newRule);
	}

	var loadRule = function(id, ruleSet) {
		var rule = ensemble.getRuleById(id);
		console.log("loaded rule", rule);
		if (rule !== false) {
			rulesEditor.loadRule(rule, ruleSet);
		} else {
			messages.showAlert("Could not load this rule.");
			return;
		}
		$("#tabLiRulesEditor a").click();
		// Switch to editor tab.
	}

	var show = function(ruleSet) {
		if (ruleSet === undefined) {
			show("trigger");
			show("volition");
			return;
		}

		var rules = ensemble.getRules(ruleSet);
		var table = $("<table/>", {
			class: "rules"
		});

		var makeRow = function(ruleAsTxt, rl, desc) {
			var ruleClass = "ruleOrigin";
			var rowClass = rl.isActive === false ? "inactive": "";
			var row = $("<tr/>", {
				class: rowClass,
				html: "<td class='ruleActiveBoxCol'><input type='checkbox' name='vehicle' class='ruleActiveBox' value='Bike'></td><td class='ruleCol'><p class='" + ruleClass + "'>" + rl.origin + "</p><span class='ruleName'>" + rl.name + "</span><br/><span title=\"" + ruleAsTxt + "\" class='ruleDetails'>" + desc + "</span></td>"
			});
			row.find(".ruleActiveBox")
				.prop('checked', rl.isActive !== false)
				.click(function() {
					rl.isActive = $(this).prop('checked');
					rulesEditor.updateRule(rl.id, rl);
					show(ruleSet);
				});
			row.find(".ruleCol")
				.click(function() {
					loadRule(rl.id, ruleSet);
				});
			return row;
		}

		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			var desc = ensemble.ruleToEnglish(rule);
			var origRule = util.objToText(rule);
			table.append(makeRow(origRule, rule, desc));
		}
		if (rules.length === 0) {
			var row = $("<tr/>", {
				html: "<span class='ruleName'>No " + ruleSet + " Rules.</span>"
			})
			table.append(row);
		}
		var id = "#tabs" + ruleSet;
		$(id).html(table);
	}

	var filterWithout = function(ruleAreaId, val) {
		$("#"+ruleAreaId+" tr").each(function() {
			var contents = this.innerHTML;
			if (contents.toLowerCase().indexOf(val.toLowerCase()) < 0) {
				$(this).hide();
			} else {
				$(this).show();
			}
		});
		if (val !== "") {
			$("#filterWarning").show();
			$("#filterWord").html(val);
		} else {
			$("#filterWarning").hide();
		}
	}

	// Handle clicking on the "New Rule" button: create a new stub rule, register it with ensemble, load it into the editor, and switch to that tab.
	var newRule = function() {
		var type = $("#tabstrigger").is(":visible") ? "trigger" : "volition";

		var newRule = {};
		newRule.name = "New " + util.iCap(type) + " Rule";
		newRule.conditions = [];
		newRule.effects = [];
		
		var ruleWrapper = {};
		ruleWrapper.fileName = "__NEWRULE__";
		ruleWrapper.rules = [newRule];
		ruleWrapper.type = type;
		
		var newIds = ensemble.addRules(ruleWrapper);
		var ensembleRule = ensemble.getRuleById(newIds[0]);
		if(ensembleRule === false){
			//Something bad happened where the rule apparantly wasn't added correctly. Abort and show an error.
			messages.showError("Canceling New Rule: Error adding empty new rule to ensemble");
			return;
		}
		var newLoadedRule = ensemble.getRuleById(newIds[0]);
		newLoadedRule.type = type;
		rulesEditor.loadRule(newLoadedRule, type);
		
		//Try to programmatically click the 'update rule eset button' here...
		//pass in 'true' to signify we should opt out of making a backup file.
		rulesEditor.updateActiveRule(true);
		$("#tabLiRulesEditor a").click();
	};


	return {
		init: init,
		show: show,
		filterWithout: filterWithout

	}

});