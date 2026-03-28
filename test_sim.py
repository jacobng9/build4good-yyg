from poker.game import PokerGame
from bot.agent import BotAgent

def run_sim():
    game = PokerGame(["Alice", "Bot"])
    alice, bot = game.players[0], game.players[1]
    game.start_hand()
    agent = BotAgent()
    print("Alice Hand:", alice.hand)
    print("Bot Hand:", bot.hand)
    action, amt = agent.decide_action(bot, game)
    print("Bot Pre-flop Action:", action, amt)
    game.deal_flop()
    print("Flop:", game.community_cards)
    game.deal_turn()
    game.deal_river()
    winner, reason = game.evaluate_winner()
    print("Winner:", winner.name if winner else "None", reason)

if __name__ == "__main__":
    run_sim()
