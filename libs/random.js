const random = (Min, Max) => {
    var Range = Max - Min
    var Rand = Math.random()
    return Min + Math.round(Rand * Range)
}

exports = module.exports = random