exports.findMatches = (listingToMatch, allExchanges) => {
    const matches = [];

    const otherExchanges = allExchanges.filter(
        exchange => exchange.user.toString() !== listingToMatch.user.toString() &&
            exchange.is_active &&
            exchange.exchange_status === 'open'
    );

    for (const exchange of otherExchanges) {
        const matchScore = calculateMatchScore(listingToMatch, exchange);

        if (matchScore > 0) {
            matches.push({
                exchange,
                user: exchange.user,
                match_score: matchScore
            });
        }
    }

    return matches.sort((a, b) => b.match_score - a.match_score);
};

exports.calculateMatchScore = calculateMatchScore;

function calculateMatchScore(listing1, listing2) {
    let score = 0;

    const listing1OfferedSkills = listing1.skills_offered.map(skill => skill.name.toLowerCase());
    const listing2WantedSkills = listing2.skills_wanted.map(skill => skill.name.toLowerCase());

    const listing2OfferedSkills = listing2.skills_offered.map(skill => skill.name.toLowerCase());
    const listing1WantedSkills = listing1.skills_wanted.map(skill => skill.name.toLowerCase());

    const match1To2 = calculateSkillMatchPercentage(listing1OfferedSkills, listing2WantedSkills);
    const match2To1 = calculateSkillMatchPercentage(listing2OfferedSkills, listing1WantedSkills);

    score = (match1To2 + match2To1) / 2;

    const exactMatches = countExactMatches(
        listing1OfferedSkills, listing2WantedSkills,
        listing2OfferedSkills, listing1WantedSkills
    );

    score += exactMatches * 10;

    return Math.min(score, 100);
}

function calculateSkillMatchPercentage(offeredSkills, wantedSkills) {
    if (wantedSkills.length === 0) return 0;

    let matchCount = 0;

    for (const skill of wantedSkills) {
        if (offeredSkills.includes(skill)) {
            matchCount += 1;
            continue;
        }

        for (const offeredSkill of offeredSkills) {
            if (offeredSkill.includes(skill) || skill.includes(offeredSkill)) {
                matchCount += 0.5;
                break;
            }
        }
    }

    return (matchCount / wantedSkills.length) * 100;
}

function countExactMatches(offered1, wanted2, offered2, wanted1) {
    let exactMatches = 0;

    exactMatches += offered1.filter(skill => wanted2.includes(skill)).length;

    exactMatches += offered2.filter(skill => wanted1.includes(skill)).length;

    return exactMatches;
}
