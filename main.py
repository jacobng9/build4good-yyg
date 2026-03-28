from poker.game import PokerGame
from bot.agent import BotAgent

def print_game_state(game, human_player):
    print("\n" + "="*40)
    print(f"Pot: ${game.pot}")
    print("Community Cards: ", game.community_cards if game.community_cards else "[None yet]")
    print(f"Your Hand: {human_player.hand}")
    print(f"Your Balance: ${human_player.balance}")
    for p in game.players:
        if p != human_player:
            print(f"{p.name}: ${p.balance} (Bet: ${p.current_bet}, Active: {p.is_active})")
    print("="*40 + "\n")

def bet_round(game, bot_agent, human_player):
    active_players = [p for p in game.players if p.is_active]
    if len(active_players) <= 1:
        return

    highest_bet = max(p.current_bet for p in active_players)
    
    for p in active_players:
        if not p.is_active or p.balance == 0:
            continue
            
        amount_to_call = highest_bet - p.current_bet
        
        if p == human_player:
            print_game_state(game, human_player)
            print(f"Amount to call: ${amount_to_call}")
            action = input("Action (f)old, (c)all/check, (r)aise: ").strip().lower()
            if action == 'f':
                p.fold()
                print("You folded.")
            elif action == 'r':
                try:
                    raise_amt = int(input("Total raise amount (including call): "))
                    game.pot += p.bet(raise_amt)
                    if p.current_bet > highest_bet:
                        highest_bet = p.current_bet
                except ValueError:
                    print("Invalid amount, calling instead.")
                    game.pot += p.bet(amount_to_call)
            else:
                game.pot += p.bet(amount_to_call)
                print(f"You called/checked ${amount_to_call}.")
        else:
            action, amt = bot_agent.decide_action(p, game)
            if action == 'fold':
                p.fold()
            else:
                game.pot += p.bet(amt)
                if p.current_bet > highest_bet:
                    highest_bet = p.current_bet
            print(f"{p.name} decides to {action} ${amt}")

def play_poker():
    print("Welcome to CLI Texas Hold'em!")
    human_name = input("Enter your name: ")
    game = PokerGame([human_name, "PokerBot"])
    human_player = game.players[0]
    bot_agent = BotAgent("PokerBot")
    
    while True:
        if len([p for p in game.players if p.balance > 0]) < 2:
            print("Game Over! Not enough players with money.")
            break
            
        print("\n--- NEW HAND ---")
        game.start_hand()
        if not human_player.is_active:
            print("You are out of money!")
            break
            
        # Pre-flop
        print("\n--- Pre-flop Betting ---")
        bet_round(game, bot_agent, human_player)
        
        # Flop
        if sum(1 for p in game.players if p.is_active) > 1:
            game.deal_flop()
            print("\n--- Flop Betting ---")
            bet_round(game, bot_agent, human_player)
            
        # Turn
        if sum(1 for p in game.players if p.is_active) > 1:
            game.deal_turn()
            print("\n--- Turn Betting ---")
            bet_round(game, bot_agent, human_player)
            
        # River
        if sum(1 for p in game.players if p.is_active) > 1:
            game.deal_river()
            print("\n--- River Betting ---")
            bet_round(game, bot_agent, human_player)
            
        print("\n--- SHOWDOWN ---")
        print_game_state(game, human_player)
        for p in game.players:
            if p.is_active and p != human_player:
                print(f"{p.name}'s hand: {p.hand}")
                
        winner, reason = game.evaluate_winner()
        if winner:
            print(f"\nWinner: {winner.name} with {reason}!")
        else:
            print("\nNo winner!")
            
        play_again = input("\nPlay another hand? (y/n): ").lower()
        if play_again != 'y':
            break

if __name__ == "__main__":
    play_poker()
