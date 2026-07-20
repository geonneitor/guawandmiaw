import os
import time
from flask import Flask, render_template, jsonify, send_from_directory
from flask_talisman import Talisman
from flask_migrate import Migrate
from backend.extensions import db, cors, jwt, limiter
from backend.config import Config

def create_app(config_class=Config):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    frontend_dir = os.path.join(base_dir, '..', 'frontend')
    dist_dir = os.path.join(frontend_dir, 'dist')

    if os.path.exists(dist_dir):
        app = Flask(__name__, 
                    template_folder=dist_dir, 
                    static_folder=dist_dir,
                    static_url_path='')
    else:
        app = Flask(__name__, 
                    template_folder=frontend_dir, 
                    static_folder=os.path.join(frontend_dir, 'static'))
    
    app.config.from_object(config_class)

    # Configure Logging
    import logging
    from logging.handlers import RotatingFileHandler
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/guawmiaw.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Guaw & Miaw startup')

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    Migrate(app, db)

    # Security: Talisman for Production
    if os.environ.get('FLASK_ENV') == 'production':
        Talisman(app, content_security_policy=None)

    # Context processors
    @app.context_processor
    def inject_version():
        return {'version': int(time.time())}

    # Register blueprints
    from backend.routes import products_bp, sales_bp, corte_bp, suppliers_bp, expenses_bp, clients_bp, reports_bp, inventory_bp
    from backend.routes.auth_routes import auth_bp
    from backend.routes.settings_routes import settings_bp
    
    app.register_blueprint(products_bp, url_prefix='/api/v1')
    app.register_blueprint(sales_bp, url_prefix='/api/v1')
    app.register_blueprint(corte_bp, url_prefix='/api/v1')
    app.register_blueprint(suppliers_bp, url_prefix='/api/v1')
    app.register_blueprint(expenses_bp, url_prefix='/api/v1')
    app.register_blueprint(clients_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(reports_bp, url_prefix='/api/v1')
    app.register_blueprint(settings_bp, url_prefix='/api/v1')
    app.register_blueprint(inventory_bp, url_prefix='/api/v1')

    # Global Error Handlers
    @app.errorhandler(404)
    def handle_404(e):
        from flask import request
        if request.path.startswith('/api/'):
            return jsonify({"success": False, "error": "Recurso no encontrado (404)"}), 404
        return render_template('index.html')

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"success": False, "error": "Error interno del servidor (500)"}), 500

    # Base Routes
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/src/<path:filename>')
    def serve_src(filename):
        return send_from_directory(os.path.join(frontend_dir, 'src'), filename)

    @app.route('/api/status')
    def status():
        return jsonify({"success": True, "data": {"status": "running", "version": "v1"}})

    @app.route('/api/health')
    def health_check():
        return jsonify({"success": True, "message": "Server is running"}), 200

    @app.route('/manifest.json')
    def serve_manifest():
        return app.send_static_file('manifest.json')

    @app.route('/service-worker.js')
    def serve_sw():
        return app.send_static_file('service-worker.js')

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
