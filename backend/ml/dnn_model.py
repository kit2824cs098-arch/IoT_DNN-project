import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

class WorkerSafetyMLP(nn.Module):
    """
    Multi-Layer Perceptron (MLP) Deep Neural Network for Worker Safety Zone Prediction.
    
    Configurable Architecture:
    Input Layer
    -> [Dense(in_features, hidden_1) + ReLU + Dropout]
    -> [Dense(hidden_1, hidden_2) + ReLU + Dropout]
    -> [Dense(hidden_2, hidden_3) + ReLU]
    -> Output Layer Dense(hidden_3, 1) + Sigmoid
    """
    def __init__(self, input_dim, hidden_layers=[128, 64, 32], dropout_rate=0.25):
        super(WorkerSafetyMLP, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        for i, h_dim in enumerate(hidden_layers):
            layers.append(nn.Linear(prev_dim, h_dim))
            layers.append(nn.ReLU())
            if dropout_rate > 0.0 and i < len(hidden_layers) - 1:
                layers.append(nn.Dropout(p=dropout_rate))
            prev_dim = h_dim
            
        layers.append(nn.Linear(prev_dim, 1))
        layers.append(nn.Sigmoid())
        
        self.network = nn.Sequential(*layers)
        self.input_dim = input_dim
        self.hidden_layers = hidden_layers
        self.dropout_rate = dropout_rate

    def forward(self, x):
        return self.network(x)


class PyTorchMLPClassifier:
    """
    Scikit-learn compatible wrapper around PyTorch WorkerSafetyMLP.
    Includes training loop, Adam optimizer, BCE loss, early stopping, and class weights.
    """
    def __init__(self, input_dim=None, hidden_layers=[128, 64, 32], dropout_rate=0.25, 
                 learning_rate=0.001, batch_size=64, epochs=100, pos_weight=1.0):
        self.input_dim = input_dim
        self.hidden_layers = hidden_layers
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        self.pos_weight = pos_weight
        self.model = None

    def fit(self, X, y, X_val=None, y_val=None, patience=15):
        if self.input_dim is None:
            self.input_dim = X.shape[1]
            
        self.model = WorkerSafetyMLP(
            input_dim=self.input_dim,
            hidden_layers=self.hidden_layers,
            dropout_rate=self.dropout_rate
        )
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(device)
        
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)
        dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        if X_val is not None and y_val is not None:
            X_val_t = torch.tensor(X_val, dtype=torch.float32).to(device)
            y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1).to(device)
        else:
            X_val_t, y_val_t = None, None

        # Binary Cross Entropy loss
        criterion = nn.BCELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate, weight_decay=1e-4)

        best_loss = float('inf')
        best_state = None
        patience_counter = 0

        for epoch in range(self.epochs):
            self.model.train()
            running_loss = 0.0
            
            for batch_x, batch_y in dataloader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                optimizer.zero_grad()
                outputs = self.model(batch_x)
                
                # Apply class weighting if specified
                loss = criterion(outputs, batch_y)
                if self.pos_weight != 1.0:
                    weight_mask = torch.where(batch_y == 1, self.pos_weight, 1.0)
                    loss = (loss * weight_mask).mean()
                    
                loss.backward()
                optimizer.step()
                running_loss += loss.item() * batch_x.size(0)

            # Validation / Early Stopping check
            if X_val_t is not None and y_val_t is not None:
                self.model.eval()
                with torch.no_grad():
                    val_outputs = self.model(X_val_t)
                    val_loss = criterion(val_outputs, y_val_t).item()

                if val_loss < best_loss - 1e-4:
                    best_loss = val_loss
                    best_state = self.model.state_dict().copy()
                    patience_counter = 0
                else:
                    patience_counter += 1
                    if patience_counter >= patience:
                        # Early stopping triggered
                        break

        if best_state is not None:
            self.model.load_state_dict(best_state)
            
        return self

    def predict_proba(self, X):
        self.model.eval()
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(device)
        
        X_t = torch.tensor(X, dtype=torch.float32).to(device)
        with torch.no_grad():
            probs_pos = self.model(X_t).cpu().numpy().flatten()
            probs_neg = 1.0 - probs_pos
            return np.vstack([probs_neg, probs_pos]).T

    def predict(self, X, threshold=0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        checkpoint = {
            "input_dim": self.input_dim,
            "hidden_layers": self.hidden_layers,
            "dropout_rate": self.dropout_rate,
            "state_dict": self.model.state_dict() if self.model else None
        }
        torch.save(checkpoint, filepath)
        print(f"DNN MLP model saved to {filepath}")

    def load(self, filepath):
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        checkpoint = torch.load(filepath, map_location=device, weights_only=False)
        self.input_dim = checkpoint["input_dim"]
        self.hidden_layers = checkpoint["hidden_layers"]
        self.dropout_rate = checkpoint["dropout_rate"]
        
        self.model = WorkerSafetyMLP(
            input_dim=self.input_dim,
            hidden_layers=self.hidden_layers,
            dropout_rate=self.dropout_rate
        )
        self.model.load_state_dict(checkpoint["state_dict"])
        self.model.to(device)
        self.model.eval()
        print(f"Loaded DNN MLP model from {filepath}")
        return self
