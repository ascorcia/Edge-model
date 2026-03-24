const { Model, DataTypes } = require('sequelize');

class Prediction extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      modelVersion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      predictedValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      factors: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      accuracy: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    }, {
      sequelize,
      modelName: 'Prediction',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    });
  }
}

module.exports = Prediction;