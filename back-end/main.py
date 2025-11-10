from app import create_app

# later you can make this pull from env, e.g. ENV=prod
app = create_app(env_name="dev")

if __name__ == "__main__":
    # debug True for dev so React can talk to it easily
    # Use port 5001 to avoid conflict with macOS AirPlay on port 5000
    app.run(host="0.0.0.0", port=5001, debug=True)