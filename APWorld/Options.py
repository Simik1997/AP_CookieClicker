import typing
from dataclasses import dataclass
from Options import Choice, Option, Toggle, DefaultOnToggle, Range, OptionList, DeathLink, PerGameCommonOptions

class Goal(Range):
    """Achievment Goal"""
    display_name = "Achievment Goal"
    range_start = 1
    range_end = 639
    default = 100

class Traps(Range):
    """Traps Percentage"""
    display_name = "Traps Percentage"
    range_start = 1
    range_end = 70
    default = 50


@dataclass
class CKOptions(PerGameCommonOptions):
    advancement_goal: Goal


ck_options: typing.Dict[str, type(Option)] = {
    "advancement_goal":                     Goal,
    "traps_percentage":                     Traps
}