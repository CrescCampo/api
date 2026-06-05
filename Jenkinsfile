pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'kauamoreirabatista/cresccampo-api'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Testes') {
            steps {
                sh 'npm ci'
                sh 'npm run test:e2e'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'test-results/e2e/Junit.xml', allowEmptyArchive: true
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                archiveArtifacts artifacts: 'dist/**', fingerprint: true
            }
        }

        stage('Docker Build e Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ."
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }
    }

    post {
        always {
            script {
                env.BUILD_STATUS = currentBuild.result ?: 'SUCCESS'
                env.BUILD_NAME = currentBuild.fullDisplayName
            }
            sh 'chmod +x scripts/notify.sh && bash scripts/notify.sh'
        }
    }
}