define(["ensemble", "util", "rulesEditor", "messages", "jquery"], function(ensemble, util, rulesEditor, messages, $){

	var ruleFilterKey = function(e) {
		var raw = document.getElementById("inputRuleFilter").value;
		filterWithout("tabstrigger", raw);
		filterWithout("tabsvolition", raw);
	}

	var init = function() {
		document.getElementById("inputRuleFilter").onkeyup = ruleFilterKey;
		document.getElementById("inputRuleFilter").onchange = ruleFilterKey;
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
		var table = "<table class='rules'>";
		var table = $("<table/>", {
			class: "rules"
		});

		var makeRow = function(origRule, name, origin, desc, id) {
			var row = $("<tr/>", {
				html: "<td><p class='ruleOrigin'>" + origin + "</p><span class='ruleName'>" + name + "</span><br/><span title=\"" + origRule + "\" class='ruleDetails'>" + desc + "</span></td>"
			});
			row.click(function() {
				console.log("calling loadRule(" + id + ", " + ruleSet + ")");
				loadRule(id, ruleSet);
			})
			return row;
		}

		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			var desc = ensemble.ruleToEnglish(rule);
			var origRule = util.objToText(rule);
			table.append(makeRow(origRule, rule.name, rule.origin, desc, rule.id));
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


	return {
		init: init,
		show: show,
		filterWithout: filterWithout

	}

});