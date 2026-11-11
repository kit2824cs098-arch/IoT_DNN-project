import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.prediction import prediction_bp

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for React Frontend

# Register API routes blueprint
app.register_blueprint(prediction_bp)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ONLINE", "service": "IoT Worker Safety Zone DNN API"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting IoT Worker Safety DNN Backend Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
